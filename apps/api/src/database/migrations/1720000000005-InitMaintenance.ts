import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module 3 — Maintenance & Inspection: maintenance_schedule, maintenance_ticket,
 * work_order, work_order_part, maintenance_history, ticket_attachment. Semua bertenant + RLS.
 */
export class InitMaintenance1720000000005 implements MigrationInterface {
  name = 'InitMaintenance1720000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "maintenance_schedule" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "frequency" varchar(20) NOT NULL,
        "interval_days" int,
        "next_due_date" date NOT NULL,
        "last_done_date" date,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_schedule_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_schedule_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "maintenance_ticket" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "reporter_user_id" uuid,
        "problem" text NOT NULL,
        "severity" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'OPEN',
        "type" varchar(20) NOT NULL DEFAULT 'CORRECTIVE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ticket_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ticket_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "work_order" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "ticket_id" uuid,
        "asset_id" uuid NOT NULL,
        "technician_user_id" uuid,
        "location_id" uuid,
        "complaint" text,
        "maintenance_type" varchar(20) NOT NULL DEFAULT 'CORRECTIVE',
        "estimated_cost" numeric(18,2),
        "actual_cost" numeric(18,2),
        "started_at" timestamptz,
        "completed_at" timestamptz,
        "status" varchar(20) NOT NULL DEFAULT 'OPEN',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_wo_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wo_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wo_ticket" FOREIGN KEY ("ticket_id") REFERENCES "maintenance_ticket" ("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "work_order_part" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "work_order_id" uuid NOT NULL,
        "part_name" varchar(150) NOT NULL,
        "qty" int NOT NULL DEFAULT 1,
        "unit_cost" numeric(18,2),
        CONSTRAINT "fk_wo_part_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_wo_part_wo" FOREIGN KEY ("work_order_id") REFERENCES "work_order" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "maintenance_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "asset_id" uuid NOT NULL,
        "work_order_id" uuid,
        "technician_user_id" uuid,
        "performed_at" timestamptz NOT NULL DEFAULT now(),
        "type" varchar(20) NOT NULL,
        "parts" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "cost" numeric(18,2),
        "attachment_keys" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_maint_history_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_maint_history_asset" FOREIGN KEY ("asset_id") REFERENCES "asset" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "ticket_attachment" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "ticket_id" uuid NOT NULL,
        "file_key" text NOT NULL,
        "file_name" varchar(255),
        "mime" varchar(100),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ticket_attachment_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ticket_attachment_ticket" FOREIGN KEY ("ticket_id") REFERENCES "maintenance_ticket" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_schedule_tenant_asset" ON "maintenance_schedule" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_schedule_due" ON "maintenance_schedule" ("tenant_id", "active", "next_due_date");`);
    await queryRunner.query(`CREATE INDEX "idx_ticket_tenant_asset" ON "maintenance_ticket" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_ticket_tenant_status" ON "maintenance_ticket" ("tenant_id", "status");`);
    await queryRunner.query(`CREATE INDEX "idx_work_order_tenant_asset" ON "work_order" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_wo_part_tenant_wo" ON "work_order_part" ("tenant_id", "work_order_id");`);
    await queryRunner.query(`CREATE INDEX "idx_maint_history_tenant_asset" ON "maintenance_history" ("tenant_id", "asset_id");`);
    await queryRunner.query(`CREATE INDEX "idx_ticket_attachment_ticket" ON "ticket_attachment" ("tenant_id", "ticket_id");`);

    for (const table of [
      'maintenance_schedule',
      'maintenance_ticket',
      'work_order',
      'work_order_part',
      'maintenance_history',
      'ticket_attachment',
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
      'ticket_attachment',
      'maintenance_history',
      'work_order_part',
      'work_order',
      'maintenance_ticket',
      'maintenance_schedule',
    ]) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
