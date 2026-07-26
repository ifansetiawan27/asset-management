import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Membuat skema platform inti: tenant, permission, role, app_user,
 * beserta tabel relasi role_permissions & user_roles.
 */
export class InitPlatform1720000000001 implements MigrationInterface {
  name = 'InitPlatform1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      CREATE TABLE "tenant" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "slug" varchar(63) NOT NULL,
        "tier" varchar(20) NOT NULL DEFAULT 'standard',
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "region" varchar(30),
        "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_tenant_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "permission" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(100) NOT NULL,
        "description" varchar(255),
        CONSTRAINT "uq_permission_code" UNIQUE ("code")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "role" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(50) NOT NULL,
        "name" varchar(100) NOT NULL,
        "is_system" boolean NOT NULL DEFAULT false,
        CONSTRAINT "uq_role_tenant_code" UNIQUE ("tenant_id", "code"),
        CONSTRAINT "fk_role_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "app_user" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "external_id" varchar(150),
        "email" varchar(255) NOT NULL,
        "full_name" varchar(150) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "mfa_enabled" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_tenant_email" UNIQUE ("tenant_id", "email"),
        CONSTRAINT "fk_user_tenant" FOREIGN KEY ("tenant_id")
          REFERENCES "tenant" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "pk_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "fk_rp_role" FOREIGN KEY ("role_id")
          REFERENCES "role" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_rp_permission" FOREIGN KEY ("permission_id")
          REFERENCES "permission" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "pk_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "fk_ur_user" FOREIGN KEY ("user_id")
          REFERENCES "app_user" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_ur_role" FOREIGN KEY ("role_id")
          REFERENCES "role" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_role_tenant" ON "role" ("tenant_id");`);
    await queryRunner.query(`CREATE INDEX "idx_user_tenant" ON "app_user" ("tenant_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "app_user";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permission";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant";`);
  }
}
