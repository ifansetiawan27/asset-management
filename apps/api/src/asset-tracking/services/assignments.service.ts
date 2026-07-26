import { Injectable, NotFoundException } from '@nestjs/common';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { AssetAssignment } from '../entities/asset-assignment.entity';
import { AssetHistoryEvent, AssigneeType } from '../tracking.enums';
import { AssetHistoryService } from './asset-history.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly tenant: TenantService,
    private readonly history: AssetHistoryService,
  ) {}

  create(dto: CreateAssignmentDto, userId?: string): Promise<AssetAssignment> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }

      const assignment = em.create(AssetAssignment, {
        tenantId,
        assetId: dto.assetId,
        assigneeType: dto.assigneeType,
        assigneeId: dto.assigneeId,
        assignedBy: userId ?? null,
        note: dto.note ?? null,
      });
      const saved = await em.save(assignment);

      if (dto.assigneeType === AssigneeType.USER) {
        asset.custodianUserId = dto.assigneeId;
      } else if (dto.assigneeType === AssigneeType.DEPARTMENT) {
        asset.departmentId = dto.assigneeId;
      } else if (dto.assigneeType === AssigneeType.LOCATION) {
        asset.locationId = dto.assigneeId;
      }
      await em.save(asset);

      await this.history.record(em, dto.assetId, AssetHistoryEvent.ASSIGNED, userId, {
        assigneeType: dto.assigneeType,
        assigneeId: dto.assigneeId,
      });
      return saved;
    });
  }

  list(assetId?: string): Promise<AssetAssignment[]> {
    return this.tenant.withTenant((em) =>
      em.find(AssetAssignment, {
        where: assetId ? { assetId } : {},
        order: { assignedAt: 'DESC' },
      }),
    );
  }

  release(id: string): Promise<AssetAssignment> {
    return this.tenant.withTenant(async (em) => {
      const assignment = await em.findOne(AssetAssignment, { where: { id } });
      if (!assignment) {
        throw new NotFoundException('Assignment tidak ditemukan');
      }
      assignment.releasedAt = new Date();
      return em.save(assignment);
    });
  }
}
