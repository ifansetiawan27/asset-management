import { Injectable, NotFoundException } from '@nestjs/common';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { CreateHandoverDto } from '../dto/create-handover.dto';
import { Handover } from '../entities/handover.entity';
import { AssetHistoryEvent } from '../tracking.enums';
import { AssetHistoryService } from './asset-history.service';

@Injectable()
export class HandoversService {
  constructor(
    private readonly tenant: TenantService,
    private readonly history: AssetHistoryService,
  ) {}

  create(dto: CreateHandoverDto, userId?: string): Promise<Handover> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const asset = await em.findOne(Asset, { where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Asset tidak ditemukan');
      }

      const handover = em.create(Handover, {
        tenantId,
        assetId: dto.assetId,
        refType: dto.refType ?? null,
        refId: dto.refId ?? null,
        fromUserId: userId ?? null,
        toUserId: dto.toUserId ?? null,
        signatureKey: dto.signatureKey ?? null,
        photoKeys: dto.photoKeys ?? [],
        conditionNote: dto.conditionNote ?? null,
      });
      const saved = await em.save(handover);

      await this.history.record(em, dto.assetId, AssetHistoryEvent.HANDOVER, userId, {
        handoverId: saved.id,
      });
      return saved;
    });
  }

  list(assetId: string): Promise<Handover[]> {
    return this.tenant.withTenant((em) =>
      em.find(Handover, { where: { assetId }, order: { signedAt: 'DESC' } }),
    );
  }
}
