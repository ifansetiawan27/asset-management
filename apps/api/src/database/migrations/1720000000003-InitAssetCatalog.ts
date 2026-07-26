import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module 1 — Asset Catalog: asset_category, vendor, asset, asset_document,
 * dan asset_code_sequence (untuk generator kode atomik). Semua bertenant + RLS.
 */
export class InitAssetCatalog1720000000003 implements MigrationInterface {
  name = 'InitAssetCatalog1720000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "asset_category" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(30) NOT NULL,
        "name" varchar(150) NOT NULL,
        "default_useful_life_years" int,
        "default_depreciation_method" varchar(30) NOT NULL DEFAULT 'STRAIGHT_LINE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_category_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "fk_category_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "vendor" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(30) NOT NULL,
        "name" varchar(150) NOT NULL,
        "contact" varchar(150),
        "email" varchar(255),
        "phone" varchar(50),
        "address" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_vendor_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "fk_vendor_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "asset" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_code" varchar(50) NOT NULL,
        "name" varchar(200) NOT NULL,
        "category_id" uuid NOT NULL,
        "brand" varchar(100),
        "model" varchar(100),
        "serial_number" varchar(120),
        "asset_type" varchar(50),
        "purchase_date" date,
        "purchase_price" numeric(18,2),
        "salvage_value" numeric(18,2) DEFAULT 0,
        "currency" char(3) NOT NULL DEFAULT 'IDR',
        "vendor_id" uuid,
        "warranty_expiry" date,
        "useful_life_years" int,
        "depreciation_method" varchar(30) NOT NULL DEFAULT 'STRAIGHT_LINE',
        "book_value" numeric(18,2),
        "location_id" uuid,
        "department_id" uuid,
        "custodian_user_id" uuid,
        "status" varchar(20) NOT NULL DEFAULT 'DRAFT',
        "qr_url" text,
        "barcode_url" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "updated_by" uuid,
        "deleted_at" timestamptz,
        CONSTRAINT "uq_asset_tenant_code" UNIQUE ("tenant_id", "asset_code"),
        CONSTRAINT "fk_asset_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_asset_category" FOREIGN KEY ("category_id")
          REFERENCES "asset_category" ("id"),
        CONSTRAINT "fk_asset_vendor" FOREIGN KEY ("vendor_id")
          REFERENCES "vendor" ("id"),
        CONSTRAINT "fk_asset_custodian" FOREIGN KEY ("custodian_user_id")
          REFERENCES "app_user" ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_document" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "doc_type" varchar(20) NOT NULL,
        "file_key" text NOT NULL,
        "file_name" varchar(255),
        "mime" varchar(100),
        "size" bigint,
        "uploaded_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_document_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_document_asset" FOREIGN KEY ("asset_id")
          REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_code_sequence" (
        "tenant_id" uuid NOT NULL,
        "period_year" int NOT NULL,
        "last_seq" int NOT NULL DEFAULT 0,
        CONSTRAINT "pk_asset_code_sequence" PRIMARY KEY ("tenant_id", "period_year"),
        CONSTRAINT "fk_seq_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_asset_tenant_status" ON "asset" ("tenant_id", "status");`);
    await queryRunner.query(`CREATE INDEX "idx_asset_tenant_category" ON "asset" ("tenant_id", "category_id");`);
    await queryRunner.query(`CREATE INDEX "idx_asset_serial" ON "asset" ("serial_number");`);
    await queryRunner.query(`CREATE INDEX "idx_asset_document_asset" ON "asset_document" ("tenant_id", "asset_id");`);

    // Row-Level Security untuk semua tabel bertenant pada modul ini
    for (const table of ['asset_category', 'vendor', 'asset', 'asset_document', 'asset_code_sequence']) {
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
    for (const table of ['asset_code_sequence', 'asset_document', 'asset', 'vendor', 'asset_category']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
