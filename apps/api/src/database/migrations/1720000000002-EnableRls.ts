import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mengaktifkan Row-Level Security (RLS) untuk tabel bertenant.
 *
 * Policy memfilter baris berdasarkan GUC `app.current_tenant` yang disetel
 * per-transaksi oleh aplikasi. `current_setting(..., true)` mengembalikan NULL
 * bila belum diset, sehingga default-nya TIDAK ada baris yang terlihat (aman).
 *
 * FORCE ROW LEVEL SECURITY memastikan pemilik tabel pun tunduk pada policy.
 * (Superuser tetap mem-bypass RLS — karena itu runtime app memakai role
 * non-superuser `ams_app`, sedangkan migrasi/seed memakai `ams_admin`.)
 */
export class EnableRls1720000000002 implements MigrationInterface {
  name = 'EnableRls1720000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['role', 'app_user']) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      await queryRunner.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
      await queryRunner.query(`
        CREATE POLICY "tenant_isolation_${table}" ON "${table}"
          USING ("tenant_id" = current_setting('app.current_tenant', true)::uuid)
          WITH CHECK ("tenant_id" = current_setting('app.current_tenant', true)::uuid);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['role', 'app_user']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`ALTER TABLE "${table}" NO FORCE ROW LEVEL SECURITY;`);
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
    }
  }
}
