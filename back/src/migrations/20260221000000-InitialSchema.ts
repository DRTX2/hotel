import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial: crea el esquema completo de la API de hoteles.
 * Orden respetando dependencias de clave foránea:
 *   hotels → rooms → guests → reservations
 */
export class InitialSchema20260221000000 implements MigrationInterface {
  name = 'InitialSchema20260221000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Enums ────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."rooms_status_enum"
          AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."rooms_type_enum"
          AS ENUM ('SINGLE', 'DOUBLE', 'SUITE');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."reservations_status_enum"
          AS ENUM ('PENDING', 'PAID', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ─── hotels ───────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hotels" (
        "id"          SERIAL              NOT NULL,
        "public_id"   UUID                NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP           NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMP,
        "name"        VARCHAR(255)        NOT NULL,
        "city"        VARCHAR(100)        NOT NULL,
        "description" TEXT,
        "rating"      DECIMAL(3,2)        NOT NULL DEFAULT 0,
        CONSTRAINT "PK_hotels_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_hotels_public_id" UNIQUE      ("public_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_hotels_city"
        ON "hotels" ("city");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_hotels_name_city"
        ON "hotels" ("name", "city");
    `);

    // ─── rooms ────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id"          SERIAL                      NOT NULL,
        "public_id"   UUID                        NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  TIMESTAMP                   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP                   NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMP,
        "number"      VARCHAR(50)                 NOT NULL,
        "status"      "public"."rooms_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "type"        "public"."rooms_type_enum"   NOT NULL DEFAULT 'SINGLE',
        "base_price"  INT                         NOT NULL,
        "hotel_id"    INT                         NOT NULL,
        CONSTRAINT "PK_rooms_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rooms_public_id" UNIQUE      ("public_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rooms_number"
        ON "rooms" ("number");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_rooms_hotel_id'
        ) THEN
          ALTER TABLE "rooms"
            ADD CONSTRAINT "FK_rooms_hotel_id"
            FOREIGN KEY ("hotel_id")
            REFERENCES "hotels" ("id")
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // ─── guests ───────────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "guests" (
        "id"              SERIAL       NOT NULL,
        "public_id"       UUID         NOT NULL DEFAULT gen_random_uuid(),
        "created_at"      TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP    NOT NULL DEFAULT now(),
        "deleted_at"      TIMESTAMP,
        "full_name"       VARCHAR(150) NOT NULL,
        "email"           VARCHAR(100) NOT NULL,
        "phone"           VARCHAR(20),
        "document_type"   VARCHAR(20)  NOT NULL,
        "document_number" VARCHAR(50)  NOT NULL,
        CONSTRAINT "PK_guests_id"              PRIMARY KEY ("id"),
        CONSTRAINT "UQ_guests_public_id"       UNIQUE      ("public_id"),
        CONSTRAINT "UQ_guests_email"           UNIQUE      ("email"),
        CONSTRAINT "UQ_guests_document_number" UNIQUE      ("document_number")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_guests_document_number"
        ON "guests" ("document_number");
    `);

    // ─── reservations ─────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservations" (
        "id"          SERIAL                              NOT NULL,
        "public_id"   UUID                                NOT NULL DEFAULT gen_random_uuid(),
        "created_at"  TIMESTAMP                           NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP                           NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMP,
        "check_in"    DATE                                NOT NULL,
        "check_out"   DATE                                NOT NULL,
        "num_guests"  INT                                 NOT NULL DEFAULT 1,
        "status"      "public"."reservations_status_enum" NOT NULL DEFAULT 'PENDING',
        "total_price" INT                                 NOT NULL DEFAULT 0,
        "room_id"     INT                                 NOT NULL,
        "guest_id"    INT                                 NOT NULL,
        CONSTRAINT "PK_reservations_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reservations_public_id" UNIQUE      ("public_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reservations_check_in"
        ON "reservations" ("check_in");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reservations_check_out"
        ON "reservations" ("check_out");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_reservations_room_id'
        ) THEN
          ALTER TABLE "reservations"
            ADD CONSTRAINT "FK_reservations_room_id"
            FOREIGN KEY ("room_id")
            REFERENCES "rooms" ("id")
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_reservations_guest_id'
        ) THEN
          ALTER TABLE "reservations"
            ADD CONSTRAINT "FK_reservations_guest_id"
            FOREIGN KEY ("guest_id")
            REFERENCES "guests" ("id")
            ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Invertir en orden de dependencias

    await queryRunner.query(`DROP TABLE IF EXISTS "reservations" CASCADE;`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."reservations_status_enum";`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "rooms" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."rooms_type_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."rooms_status_enum";`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "guests" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hotels" CASCADE;`);
  }
}
