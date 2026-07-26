import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { AssetStatus } from '../../asset-catalog/enums/asset-status.enum';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { AssetBorrowing } from '../entities/asset-borrowing.entity';
import { AssetTransfer } from '../entities/asset-transfer.entity';
import { AssetHistoryService } from '../services/asset-history.service';
import {
  AssetHistoryEvent,
  BorrowingStatus,
  TransferStatus,
} from '../tracking.enums';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalDecision, ApprovalEntityType, ApprovalStatus } from './approval.enums';

/**
 * Approval Engine (single-level). Membuat permintaan approval, menampilkan inbox,
 * dan menerapkan efek ke entitas terkait saat diputuskan.
 */
@Injectable()
export class ApprovalsService {
  constructor(
    private readonly tenant: TenantService,
    private readonly history: AssetHistoryService,
  ) {}

  /** Dipanggil DALAM transaksi withTenant lain (memakai `em`). */
  createRequest(
    em: EntityManager,
    entityType: ApprovalEntityType,
    entityId: string,
    approverRole: string,
  ): Promise<ApprovalRequest> {
    const request = em.create(ApprovalRequest, {
      tenantId: getTenantId() as string,
      entityType,
      entityId,
      approverRole,
      status: ApprovalStatus.PENDING,
    });
    return em.save(request);
  }

  listInbox(): Promise<ApprovalRequest[]> {
    return this.tenant.withTenant((em) =>
      em.find(ApprovalRequest, {
        where: { status: ApprovalStatus.PENDING },
        order: { createdAt: 'DESC' },
      }),
    );
  }

  decide(
    id: string,
    decision: ApprovalDecision,
    note: string | undefined,
    actorUserId?: string,
  ): Promise<ApprovalRequest> {
    return this.tenant.withTenant(async (em) => {
      const request = await em.findOne(ApprovalRequest, { where: { id } });
      if (!request) {
        throw new NotFoundException('Approval request tidak ditemukan');
      }
      if (request.status !== ApprovalStatus.PENDING) {
        throw new ConflictException('Approval sudah diputuskan sebelumnya');
      }

      const approved = decision === ApprovalDecision.APPROVE;
      request.status = approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
      request.decidedBy = actorUserId ?? null;
      request.note = note ?? null;
      request.decidedAt = new Date();
      await em.save(request);

      await this.applyEffect(em, request, approved, actorUserId);
      return request;
    });
  }

  private async applyEffect(
    em: EntityManager,
    request: ApprovalRequest,
    approved: boolean,
    actorUserId?: string,
  ): Promise<void> {
    if (request.entityType === ApprovalEntityType.TRANSFER) {
      const transfer = await em.findOne(AssetTransfer, { where: { id: request.entityId } });
      if (!transfer) return;
      transfer.status = approved ? TransferStatus.APPROVED : TransferStatus.REJECTED;
      await em.save(transfer);
      await this.history.record(
        em,
        transfer.assetId,
        approved ? AssetHistoryEvent.TRANSFER_APPROVED : AssetHistoryEvent.TRANSFER_REJECTED,
        actorUserId,
        { transferId: transfer.id },
      );
      return;
    }

    if (request.entityType === ApprovalEntityType.BORROWING) {
      const borrowing = await em.findOne(AssetBorrowing, { where: { id: request.entityId } });
      if (!borrowing) return;

      if (approved) {
        borrowing.status = BorrowingStatus.BORROWED;
        borrowing.borrowDate = new Date();
        await em.save(borrowing);

        const asset = await em.findOne(Asset, { where: { id: borrowing.assetId } });
        if (asset) {
          asset.status = AssetStatus.BORROWED;
          await em.save(asset);
        }
        await this.history.record(em, borrowing.assetId, AssetHistoryEvent.BORROWED, actorUserId, {
          borrowingId: borrowing.id,
        });
      } else {
        borrowing.status = BorrowingStatus.REJECTED;
        await em.save(borrowing);
        await this.history.record(
          em,
          borrowing.assetId,
          AssetHistoryEvent.BORROW_REJECTED,
          actorUserId,
          { borrowingId: borrowing.id },
        );
      }
    }
    // ApprovalEntityType.DISPOSAL ditangani pada Module 5.
  }
}
