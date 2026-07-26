import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

import { getTenantId } from './tenant-context';

/**
 * Menyediakan eksekusi query yang sadar-tenant.
 *
 * `withTenant` membuka transaksi lalu menyetel variabel sesi
 * `app.current_tenant` (transaction-local via set_config(..., true)).
 * PostgreSQL Row-Level Security akan memfilter baris berdasarkan tenant ini.
 */
@Injectable()
export class TenantService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async withTenant<T>(
    cb: (em: EntityManager) => Promise<T>,
    tenantIdOverride?: string,
  ): Promise<T> {
    const tenantId = tenantIdOverride ?? getTenantId();
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant tidak ditemukan. Sertakan header X-Tenant-ID.',
      );
    }

    return this.dataSource.transaction(async (em) => {
      // set_config(setting, value, is_local=true) -> hanya berlaku untuk transaksi ini
      await em.query('SELECT set_config($1, $2, true)', [
        'app.current_tenant',
        tenantId,
      ]);
      return cb(em);
    });
  }
}
