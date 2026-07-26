import { MigrationInterface, QueryRunner } from 'typeorm';

/** Modul Notification: notification, notification_template. Semua bertenant + RLS. */
export class InitNotification1720000000009 implements MigrationInterface {
  name = 'InitNotification1720000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notification_template" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(50) NOT NULL,
        "channel" varchar(20) NOT NULL,
        "locale" varchar(10) NOT NULL DEFAULT 'id',
        "subject" varchar(255),
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_template_tenant_code" UNIQUE ("tenant_id", "code", "channel", "locale"),
        CONSTRAINT "fk_template_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "channel" varchar(20) NOT NULL,
        "template_code" varchar(50),
        "subject" varchar(255),
        "body" text NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "sent_at" timestamptz,
        "read_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_notification_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_notification_tenant_user" ON "notification" ("tenant_id", "user_id", "status");`);

    for (const table of ['notification_template', 'notification']) {
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
    for (const table of ['notification', 'notification_template']) {
      await queryRunner.query(`DROP POLICY IF EXISTS "tenant_isolation_${table}" ON "${table}";`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}";`);
    }
  }
}
