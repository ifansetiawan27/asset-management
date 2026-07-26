import { MigrationInterface, QueryRunner } from 'typeorm';

/** Modul Billing (SaaS): subscription, usage_metric. Semua bertenant + RLS. */
export class InitBilling1720000000008 implements MigrationInterface {
  name = 'InitBilling1720000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "plan_code" varchar(20) NOT NULL DEFAULT 'STANDARD',
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "current_period_start" timestamptz,
        "current_period_end" timestamptz,
        "seats" int NOT NULL DEFAULT 10,
        "asset_quota" int NOT NULL DEFAULT 1000,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_subscription_tenant" UNIQUE ("tenant_id"),
        CONSTRAINT "fk_subscription_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "usage_metric" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "metric" varchar(20) NOT NULL,
        "value" bigint NOT NULL DEFAULT 0,
        "recorded_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_usage_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_usage_tenant_metric" ON "usage_metric" ("tenant_id", "metric");`);

    for (const table of ['subscription', 'usage_metric']) {
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
    for (const table of ['usage_metric', 'subscription']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
