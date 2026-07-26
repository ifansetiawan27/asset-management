import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { AssetStatus } from '../../asset-catalog/enums/asset-status.enum';
import { ApprovalRequest } from '../../asset-tracking/approval/approval-request.entity';
import {
  ApprovalEntityType,
  ApprovalStatus,
} from '../../asset-tracking/approval/approval.enums';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateDisposalDto } from '../dto/create-disposal.dto';
import { DisposalRequest } from '../entities/disposal-request.entity';
import { DisposalStatus } from '../disposal.enums';

@Injectable()
export class DisposalService {
  constructor(private readonly tenant: TenantService) {}

  /** Ajukan disposal → buat approval (DEPARTMENT_MANAGER) + aset UNDER_REVIEW (FR-M5-1). */
  create(dto: CreateDisposalDto, userId?: string): Promise<DisposalRequest> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }
      if (asset.status === AssetStatus.DISPOSED) {
        throw new ConflictException('Aset sudah disposed');
      }

      let disposal = em.create(DisposalRequest, {
        tenantId,
        assetId: dto.assetId,
        reason: dto.reason,
        status: DisposalStatus.UNDER_REVIEW,
        saleValue: dto.saleValue ?? null,
        requestedBy: userId ?? null,
      });
      disposal = await em.save(disposal);

      // Integrasi Approval Engine (dinilai lewat /approvals oleh DEPARTMENT_MANAGER).
      const approval = em.create(ApprovalRequest, {
        tenantId,
        entityType: ApprovalEntityType.DISPOSAL,
        entityId: disposal.id,
        approverRole: SystemRole.DEPARTMENT_MANAGER,
        status: ApprovalStatus.PENDING,
      });
      const savedApproval = await em.save(approval);

      disposal.approvalRequestId = savedApproval.id;
      disposal = await em.save(disposal);

      asset.status = AssetStatus.UNDER_REVIEW;
      await em.save(asset);

      return disposal;
    });
  }

  list(assetId?: string): Promise<DisposalRequest[]> {
    return this.tenant.withTenant((em) =>
      em.find(DisposalRequest, {
        where: assetId ? { assetId } : {},
        order: { createdAt: 'DESC' },
      }),
    );
  }

  findOne(id: string): Promise<DisposalRequest> {
    return this.tenant.withTenant((em) => this.getOrFail(em, id));
  }

  /**
   * Finalisasi berdasarkan hasil approval (FR-M5-1):
   * APPROVED → aset DISPOSED (penyusutan berhenti otomatis); REJECTED → aset ACTIVE kembali.
   */
  finalize(id: string): Promise<DisposalRequest> {
    return this.tenant.withTenant(async (em) => {
      const disposal = await this.getOrFail(em, id);
      if (disposal.status === DisposalStatus.DISPOSED || disposal.status === DisposalStatus.ARCHIVED) {
        throw new ConflictException('Disposal sudah difinalisasi');
      }
      if (!disposal.approvalRequestId) {
        throw new ConflictException('Tidak ada approval terkait');
      }

      const approval = await em.findOne(ApprovalRequest, {
        where: { id: disposal.approvalRequestId },
      });
      if (!approval) {
        throw new NotFoundException('Approval request tidak ditemukan');
      }

      const asset = await em.findOne(Asset, { where: { id: disposal.assetId } });

      if (approval.status === ApprovalStatus.APPROVED) {
        disposal.status = DisposalStatus.DISPOSED;
        disposal.disposedAt = new Date();
        await em.save(disposal);
        if (asset) {
          asset.status = AssetStatus.DISPOSED;
          await em.save(asset);
        }
        return disposal;
      }

      if (approval.status === ApprovalStatus.REJECTED) {
        disposal.status = DisposalStatus.REJECTED;
        await em.save(disposal);
        if (asset) {
          asset.status = AssetStatus.ACTIVE;
          await em.save(asset);
        }
        return disposal;
      }

      throw new ConflictException('Masih menunggu approval');
    });
  }

  archive(id: string): Promise<DisposalRequest> {
    return this.tenant.withTenant(async (em) => {
      const disposal = await this.getOrFail(em, id);
      if (disposal.status !== DisposalStatus.DISPOSED) {
        throw new ConflictException('Hanya disposal berstatus DISPOSED yang dapat diarsipkan');
      }
      disposal.status = DisposalStatus.ARCHIVED;
      return em.save(disposal);
    });
  }

  private async getOrFail(em: EntityManager, id: string): Promise<DisposalRequest> {
    const disposal = await em.findOne(DisposalRequest, { where: { id } });
    if (!disposal) {
      throw new NotFoundException('Disposal tidak ditemukan');
    }
    return disposal;
  }
}
