import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { AssetStatus } from '../../asset-catalog/enums/asset-status.enum';
import { SystemRole } from '../../shared/rbac/roles.enum';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { ApprovalEntityType } from '../approval/approval.enums';
import { ApprovalsService } from '../approval/approvals.service';
import { CreateBorrowingDto } from '../dto/create-borrowing.dto';
import { ReturnBorrowingDto } from '../dto/return-borrowing.dto';
import { AssetBorrowing } from '../entities/asset-borrowing.entity';
import { AssetHistoryEvent, BorrowingStatus } from '../tracking.enums';
import { AssetHistoryService } from './asset-history.service';

@Injectable()
export class BorrowingsService {
  constructor(
    private readonly tenant: TenantService,
    private readonly approvals: ApprovalsService,
    private readonly history: AssetHistoryService,
  ) {}

  create(dto: CreateBorrowingDto, userId?: string): Promise<AssetBorrowing> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }
      if (asset.status === AssetStatus.BORROWED) {
        throw new ConflictException('Aset sedang dipinjam');
      }

      let borrowing = em.create(AssetBorrowing, {
        tenantId,
        assetId: dto.assetId,
        borrowerUserId: dto.borrowerUserId ?? userId ?? null,
        dueReturnDate: dto.dueReturnDate ?? null,
        conditionBefore: dto.conditionBefore ?? null,
        status: BorrowingStatus.REQUESTED,
      });
      borrowing = await em.save(borrowing);

      const approval = await this.approvals.createRequest(
        em,
        ApprovalEntityType.BORROWING,
        borrowing.id,
        SystemRole.DEPARTMENT_MANAGER,
      );
      borrowing.approvalRequestId = approval.id;
      borrowing = await em.save(borrowing);

      await this.history.record(em, dto.assetId, AssetHistoryEvent.BORROW_REQUESTED, userId, {
        borrowingId: borrowing.id,
      });
      return borrowing;
    });
  }

  list(assetId?: string): Promise<AssetBorrowing[]> {
    return this.tenant.withTenant((em) =>
      em.find(AssetBorrowing, {
        where: assetId ? { assetId } : {},
        order: { createdAt: 'DESC' },
      }),
    );
  }

  returnAsset(id: string, dto: ReturnBorrowingDto, userId?: string): Promise<AssetBorrowing> {
    return this.tenant.withTenant(async (em) => {
      const borrowing = await em.findOne(AssetBorrowing, { where: { id } });
      if (!borrowing) {
        throw new NotFoundException('Peminjaman tidak ditemukan');
      }
      if (borrowing.status !== BorrowingStatus.BORROWED) {
        throw new ConflictException('Peminjaman tidak dalam status BORROWED');
      }

      borrowing.status = BorrowingStatus.RETURNED;
      borrowing.actualReturnDate = new Date();
      borrowing.conditionAfter = dto.conditionAfter ?? null;
      await em.save(borrowing);

      const asset = await em.findOne(Asset, { where: { id: borrowing.assetId } });
      if (asset) {
        asset.status = AssetStatus.ACTIVE;
        await em.save(asset);
      }

      await this.history.record(em, borrowing.assetId, AssetHistoryEvent.RETURNED, userId, {
        borrowingId: borrowing.id,
      });
      return borrowing;
    });
  }
}
