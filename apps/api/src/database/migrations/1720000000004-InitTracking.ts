import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module 2 — Tracking & Assignment: asset_assignment, asset_transfer,
 * asset_borrowing, handover, asset_history, approval_request. Semua bertenant + RLS.
 */
export class InitTracking1720000000004 implements MigrationInterface {
  name = 'InitTracking1720000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "asset_assignment" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "assignee_type" varchar(20) NOT NULL,
        "assignee_id" uuid NOT NULL,
        "assigned_by" uuid,
        "assigned_at" timestamptz NOT NULL DEFAULT now(),
        "released_at" timestamptz,
        "note" text,
        CONSTRAINT "fk_assignment_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_assignment_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_transfer" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "from_location_id" uuid,
        "to_location_id" uuid,
        "from_department_id" uuid,
        "to_department_id" uuid,
        "reason" text,
        "status" varchar(20) NOT NULL DEFAULT 'REQUESTED',
        "requested_by" uuid,
        "approval_request_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_transfer_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_transfer_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_borrowing" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "borrower_user_id" uuid,
        "borrow_date" timestamptz,
        "due_return_date" date,
        "actual_return_date" timestamptz,
        "condition_before" text,
        "condition_after" text,
        "status" varchar(20) NOT NULL DEFAULT 'REQUESTED',
        "approval_request_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_borrowing_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_borrowing_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "handover" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "ref_type" varchar(20),
        "ref_id" uuid,
        "from_user_id" uuid,
        "to_user_id" uuid,
        "signature_key" text,
        "photo_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "condition_note" text,
        "signed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_handover_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_handover_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "asset_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "event_type" varchar(40) NOT NULL,
        "actor_user_id" uuid,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_history_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_history_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "approval_request" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "entity_type" varchar(20) NOT NULL,
        "entity_id" uuid NOT NULL,
        "approver_role" varchar(40) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "decided_by" uuid,
        "note" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "decided_at" timestamptz,
        CONSTRAINT "fk_approval_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_assignment_tenant_asset" ON "asset_assignment" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_transfer_tenant_asset" ON "asset_transfer" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_borrowing_tenant_asset" ON "asset_borrowing" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_handover_tenant_asset" ON "handover" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_history_tenant_asset" ON "asset_history" ("tenant_id", "asset_id", "occurred_at");`);
    await queryRunner.query(`CREATE INDEX "idx_approval_tenant_status" ON "approval_request" ("tenant_id", "status");`);

    for (const table of [
      'asset_assignment',
      'asset_transfer',
      'asset_borrowing',
      'handover',
      'asset_history',
      'approval_request',
    ]) {
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
    for (const table of [
      'approval_request',
      'asset_history',
      'handover',
      'asset_borrowing',
      'asset_transfer',
      'asset_assignment',
    ]) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
