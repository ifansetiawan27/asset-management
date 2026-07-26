import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

/**
 * Generator Asset Code per tenant: {PREFIX}-{CATEGORY}-{YYYY}-{SEQ:00000} (SDD §8.1).
 * Sequence atomik via upsert pada tabel asset_code_sequence (aman dari race condition).
 * Dipanggil DALAM transaksi withTenant (memakai EntityManager yang sama).
 */
@Injectable()
export class AssetCodeService {
  async next(em: EntityManager, tenantId: string, categoryCode: string): Promise<string> {
    const year = new Date().getFullYear();

    const seqRows: Array<{ last_seq: number | string }> = await em.query(
      `INSERT INTO asset_code_sequence (tenant_id, period_year, last_seq)
       VALUES ($1, $2, 1)
       ON CONFLICT (tenant_id, period_year)
       DO UPDATE SET last_seq = asset_code_sequence.last_seq + 1
       RETURNING last_seq`,
      [tenantId, year],
    );
    const seq = Number(seqRows[0].last_seq);

    const tenantRows: Array<{ slug: string }> = await em.query(
      `SELECT slug FROM tenant WHERE id = $1`,
      [tenantId],
    );
    const prefix = (tenantRows[0]?.slug ?? 'AMS').toUpperCase().slice(0, 6);
    const category = categoryCode.toUpperCase();

    return `${prefix}-${category}-${year}-${String(seq).padStart(5, '0')}`;
  }
}
