import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sprint 1 — Booking real.
 * 1. Columna `capacity` en rooms (backfill por tipo) + CHECK > 0.
 * 2. Garantía anti-overbooking a nivel DB: constraint de exclusión
 *    parcial sobre (room_id, rango de fechas) solo para reservas
 *    activas (PENDING/PAID) no eliminadas. Última línea de defensa
 *    frente a condiciones de carrera; la app además valida en
 *    transacción con bloqueo de fila.
 * 3. Índice parcial para consultas de disponibilidad.
 */
export class BookingRules20260904000000 implements MigrationInterface {
  name = 'BookingRules20260904000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

    // ── capacity ──
    await queryRunner.query(`
      ALTER TABLE "rooms"
        ADD COLUMN IF NOT EXISTS "capacity" INT;
    `);

    await queryRunner.query(`
      UPDATE "rooms"
      SET "capacity" = CASE "type"
        WHEN 'SINGLE' THEN 1
        WHEN 'DOUBLE' THEN 2
        WHEN 'SUITE'  THEN 4
        ELSE 1
      END
      WHERE "capacity" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "rooms"
        ALTER COLUMN "capacity" SET NOT NULL;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'CHK_rooms_capacity_positive'
        ) THEN
          ALTER TABLE "rooms"
            ADD CONSTRAINT "CHK_rooms_capacity_positive"
            CHECK ("capacity" > 0);
        END IF;
      END $$;
    `);

    // ── exclusión anti-solape (solo reservas activas y vivas) ──
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'UQ_reservations_no_overlap'
        ) THEN
          ALTER TABLE "reservations"
            ADD CONSTRAINT "UQ_reservations_no_overlap"
            EXCLUDE USING gist (
              "room_id" WITH =,
              daterange("check_in", "check_out") WITH &&
            )
            WHERE ("status" IN ('PENDING', 'PAID') AND "deleted_at" IS NULL);
        END IF;
      END $$;
    `);

    // ── índice para disponibilidad ──
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_reservations_availability"
        ON "reservations" ("room_id", "check_in", "check_out")
        WHERE "status" IN ('PENDING', 'PAID') AND "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservations"
        DROP CONSTRAINT IF EXISTS "UQ_reservations_no_overlap";
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_reservations_availability";`,
    );
    await queryRunner.query(`
      ALTER TABLE "rooms"
        DROP CONSTRAINT IF EXISTS "CHK_rooms_capacity_positive";
    `);
    await queryRunner.query(`
      ALTER TABLE "rooms"
        DROP COLUMN IF EXISTS "capacity";
    `);
  }
}
