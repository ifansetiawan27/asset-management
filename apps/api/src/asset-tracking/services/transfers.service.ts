import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { ApprovalEntityType } from '../approval/approval.enums';
import { ApprovalsService } from '../approval/approvals.service';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { AssetTransfer } from '../entities/asset-transfer.entity';
import { AssetHistoryEvent, TransferStatus } from '../tracking.enums';
import { AssetHistoryService } from './asset-history.service';

@Injectable()
export class TransfersService {
  constructor(
    private readonly tenant: TenantService,
    private readonly approvals: ApprovalsService,
    private readonly history: AssetHistoryService,
  ) {}

  create(dto: CreateTransferDto, userId?: string): Promise<AssetTransfer> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }

      let transfer = em.create(AssetTransfer, {
        tenantId,
        assetId: dto.assetId,
        fromLocationId: asset.locationId,
        toLocationId: dto.toLocationId ?? null,
        fromDepartmentId: asset.departmentId,
        toDepartmentId: dto.toDepartmentId ?? null,
        reason: dto.reason ?? null,
        status: TransferStatus.REQUESTED,
        requestedBy: userId ?? null,
      });
      transfer = await em.save(transfer);

      const approval = await this.approvals.createRequest(
        em,
        ApprovalEntityType.TRANSFER,
        transfer.id,
        SystemRole.DEPARTMENT_MANAGER,
      );
      transfer.approvalRequestId = approval.id;
      transfer = await em.save(transfer);

      await this.history.record(em, dto.assetId, AssetHistoryEvent.TRANSFER_REQUESTED, userId, {
        transferId: transfer.id,
      });
      return transfer;
    });
  }

  list(assetId?: string): Promise<AssetTransfer[]> {
    return this.tenant.withTenant((em) =>
      em.find(AssetTransfer, {
        where: assetId ? { assetId } : {},
        order: { createdAt: 'DESC' },
      }),
    );
  }

  /** Konfirmasi setelah approval → terapkan mutasi ke aset (FR-M2-2). */
  confirm(id: string, userId?: string): Promise<AssetTransfer> {
    return this.tenant.withTenant(async (em) => {
      const transfer = await em.findOne(AssetTransfer, { where: { id } });
      if (!transfer) {
        throw new NotFoundException('Transfer tidak ditemukan');
      }
      if (transfer.status !== TransferStatus.APPROVED) {
        throw new ConflictException('Transfer belum di-approve');
      }

      const asset = await em.findOne(Asset, { where: { id: transfer.assetId } });
      if (asset) {
        if (transfer.toLocationId) asset.locationId = transfer.toLocationId;
        if (transfer.toDepartmentId) asset.departmentId = transfer.toDepartmentId;
        await em.save(asset);
      }

      transfer.status = TransferStatus.CONFIRMED;
      await em.save(transfer);

      await this.history.record(em, transfer.assetId, AssetHistoryEvent.TRANSFERRED, userId, {
        transferId: transfer.id,
      });
      return transfer;
    });
  }
}
