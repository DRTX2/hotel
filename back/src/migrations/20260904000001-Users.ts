import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint 2 — Autenticación y RBAC: tabla de usuarios con rol
 * y hash de refresh token para rotación con detección de reuso.
 */
export class Users20260904000001 implements MigrationInterface {
  name = 'Users20260904000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum"
          AS ENUM ('admin', 'staff', 'guest');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"                 SERIAL                     NOT NULL,
        "public_id"          UUID                       NOT NULL DEFAULT gen_random_uuid(),
        "created_at"         TIMESTAMP                  NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP                  NOT NULL DEFAULT now(),
        "deleted_at"         TIMESTAMP,
        "email"              VARCHAR(255)               NOT NULL,
        "password_hash"      VARCHAR(255)               NOT NULL,
        "role"               "public"."users_role_enum" NOT NULL DEFAULT 'guest',
        "refresh_token_hash" VARCHAR(64),
        CONSTRAINT "PK_users_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_public_id" UNIQUE      ("public_id"),
        CONSTRAINT "UQ_users_email"     UNIQUE      ("email")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email"
        ON "users" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum";`);
  }
}
