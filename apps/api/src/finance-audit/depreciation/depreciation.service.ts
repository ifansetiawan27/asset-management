import { Injectable } from '@nestjs/common';

import { Asset } from '../../asset-catalog/entities/asset.entity';
import { AssetStatus } from '../../asset-catalog/enums/asset-status.enum';
import { getTenantId } from '../../shared/tenant/tenant-context';
import { TenantService } from '../../shared/tenant/tenant.service';
import { DepreciationEntry } from '../entities/depreciation-entry.entity';
import { resolveStrategy, round2 } from './strategies';

function lastDayOfMonth(year: number, month: number): string {
  // month 1-12; Date.UTC(year, month, 0) => hari terakhir bulan tsb.
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export interface BatchResult {
  period: { year: number; month: number };
  processed: number;
  skipped: number;
  entries: DepreciationEntry[];
}

@Injectable()
export class DepreciationService {
  constructor(private readonly tenant: TenantService) {}

  /** Batch penyusutan untuk satu periode (idempoten per periode) — FR-M4-1. */
  runBatch(year?: number, month?: number): Promise<BatchResult> {
    return this.tenant.withTenant(async (em) => {
      const tenantId = getTenantId() as string;
      const now = new Date();
      const y = year ?? now.getUTCFullYear();
      const m = month ?? now.getUTCMonth() + 1;
      const periodEnd = lastDayOfMonth(y, m);

      const assets = await em.find(Asset);
      const entries: DepreciationEntry[] = [];
      let skipped = 0;

      for (const asset of assets) {
        if (!this.isEligible(asset, periodEnd)) {
          skipped++;
          continue;
        }

        const already = await em.findOne(DepreciationEntry, {
          where: { assetId: asset.id, periodYear: y, periodMonth: m },
        });
        if (already) {
          skipped++;
          continue;
        }

        const prior = await em.findOne(DepreciationEntry, {
          where: { assetId: asset.id },
          order: { periodYear: 'DESC', periodMonth: 'DESC' },
        });

        const purchasePrice = asset.purchasePrice as number;
        const salvage = asset.salvageValue ?? 0;
        const base = Math.max(purchasePrice - salvage, 0);
        const priorAccumulated = prior ? prior.accumulated : 0;
        const opening = prior ? prior.bookValue : purchasePrice;

        const strategy = resolveStrategy(asset.depreciationMethod);
        const monthly = strategy.monthlyAmount({
          purchasePrice,
          salvageValue: salvage,
          usefulLifeYears: asset.usefulLifeYears as number,
        });

        const remaining = Math.max(base - priorAccumulated, 0);
        const amount = Math.min(monthly, remaining);
        const accumulated = round2(priorAccumulated + amount);
        const bookValue = round2(purchasePrice - accumulated);

        const entry = em.create(DepreciationEntry, {
          tenantId,
          assetId: asset.id,
          periodYear: y,
          periodMonth: m,
          method: asset.depreciationMethod,
          openingValue: opening,
          depreciationAmount: amount,
          accumulated,
          bookValue,
        });
        entries.push(await em.save(entry));

        asset.bookValue = bookValue;
        await em.save(asset);
      }

      return { period: { year: y, month: m }, processed: entries.length, skipped, entries };
    });
  }

  listByAsset(assetId: string): Promise<DepreciationEntry[]> {
    return this.tenant.withTenant((em) =>
      em.find(DepreciationEntry, {
        where: { assetId },
        order: { periodYear: 'DESC', periodMonth: 'DESC' },
      }),
    );
  }

  private isEligible(asset: Asset, periodEnd: string): boolean {
    if (asset.status === AssetStatus.DISPOSED) return false;
    if (asset.purchasePrice === null || asset.purchasePrice === undefined) return false;
    if (!asset.usefulLifeYears || asset.usefulLifeYears <= 0) return false;
    if (asset.purchaseDate && asset.purchaseDate > periodEnd) return false;
    return true;
  }
}
