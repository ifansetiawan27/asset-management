import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Menambah kolom `password_hash` pada `app_user` untuk autentikasi
 * email/password lokal (JWT diterbitkan API sendiri, tanpa Keycloak).
 *
 * Nullable agar user lama (SSO/seed) tetap valid; login berbasis password
 * hanya berlaku untuk user yang memiliki hash.
 */
export class AddUserPassword1720000000010 implements MigrationInterface {
  name = 'AddUserPassword1720000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_user" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_user" DROP COLUMN IF EXISTS "password_hash";`,
    );
  }
}
