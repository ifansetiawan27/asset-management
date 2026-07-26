import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module 5 — Disposal & Retirement: disposal_request, disposal_document.
 * Semua bertenant + RLS.
 */
export class InitDisposal1720000000007 implements MigrationInterface {
  name = 'InitDisposal1720000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "disposal_request" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "reason" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'UNDER_REVIEW',
        "sale_value" numeric(18,2),
        "requested_by" uuid,
        "approval_request_id" uuid,
        "disposed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_disposal_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_disposal_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "disposal_document" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "disposal_request_id" uuid NOT NULL,
        "doc_type" varchar(20) NOT NULL,
        "file_key" text NOT NULL,
        "file_name" varchar(255),
        "mime" varchar(100),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_disposal_document_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_disposal_document_request" FOREIGN KEY ("disposal_request_id") REFERENCES "disposal_request" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_disposal_tenant_asset" ON "disposal_request" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_disposal_tenant_status" ON "disposal_request" ("tenant_id", "status");`);
    await queryRunner.query(`CREATE INDEX "idx_disposal_document_request" ON "disposal_document" ("tenant_id", "disposal_request_id");`);

    for (const table of ['disposal_request', 'disposal_document']) {
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
    for (const table of ['disposal_document', 'disposal_request']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
