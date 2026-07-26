import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { AssetHistory } from '../entities/asset-history.entity';
import { AssetHistoryEvent } from '../tracking.enums';

/** Riwayat aktivitas aset (FR-M2-5). */
@Injectable()
export class AssetHistoryService {
  constructor(private readonly tenant: TenantService) {}

  /** Mencatat event. Dipanggil DALAM transaksi withTenant lain (memakai `em`). */
  async record(
    em: EntityManager,
    assetId: string,
    eventType: AssetHistoryEvent,
    actorUserId?: string | null,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    const entity = em.create(AssetHistory, {
      tenantId: getTenantId() as string,
      assetId,
      eventType,
      actorUserId: actorUserId ?? null,
      payload,
    });
    await em.save(entity);
  }

  list(assetId: string): Promise<AssetHistory[]> {
    return this.tenant.withTenant((em) =>
      em.find(AssetHistory, { where: { assetId }, order: { occurredAt: 'DESC' } }),
    );
  }
}
