import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module 4 — Depreciation & Audit: depreciation_entry, audit_session, audit_item.
 * Semua bertenant + RLS.
 */
export class InitFinanceAudit1720000000006 implements MigrationInterface {
  name = 'InitFinanceAudit1720000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "depreciation_entry" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "period_year" int NOT NULL,
        "period_month" int NOT NULL,
        "method" varchar(30) NOT NULL,
        "opening_value" numeric(18,2) NOT NULL,
        "depreciation_amount" numeric(18,2) NOT NULL,
        "accumulated" numeric(18,2) NOT NULL,
        "book_value" numeric(18,2) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_depreciation_period" UNIQUE ("tenant_id", "asset_id", "period_year", "period_month"),
        CONSTRAINT "fk_depreciation_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_depreciation_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_session" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "scope" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "started_by" uuid,
        "started_at" timestamptz,
        "closed_at" timestamptz,
        "status" varchar(20) NOT NULL DEFAULT 'PLANNED',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_audit_session_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_item" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "audit_session_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "auditor_user_id" uuid,
        "status" varchar(20) NOT NULL,
        "expected_location_id" uuid,
        "actual_location_id" uuid,
        "condition_note" text,
        "photo_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "client_id" varchar(100),
        "audited_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_audit_item_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_audit_item_session" FOREIGN KEY ("audit_session_id") REFERENCES "audit_session" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_audit_item_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_depreciation_tenant_asset" ON "depreciation_entry" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_audit_session_tenant" ON "audit_session" ("tenant_id", "status");`);
    await queryRunner.query(`CREATE INDEX "idx_audit_item_session" ON "audit_item" ("tenant_id", "audit_session_id");`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_audit_item_client" ON "audit_item" ("audit_session_id", "client_id");`);

    for (const table of ['depreciation_entry', 'audit_session', 'audit_item']) {
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
    for (const table of ['audit_item', 'audit_session', 'depreciation_entry']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
