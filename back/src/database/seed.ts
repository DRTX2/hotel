/**
 * Seed idempotente para desarrollo.
 * Uso: npm run seed (requiere DB levantada y migraciones aplicadas).
 * Seguro de re-ejecutar: busca por campos únicos antes de crear.
 *
 * Nota: la reserva de ejemplo usa fechas futuras relativas a hoy
 * para no interferir con validaciones de fechas.
 */
import '../config/load-env';
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { env } from '../config/env';
import { Hotel } from '../modules/hotel/entities/hotel.entity';
import { Room, RoomType } from '../modules/room/entities/room.entity';
import { Guest } from '../modules/guest/entities/guest.entity';
import {
  Reservation,
  ReservationStatus,
} from '../modules/reservation/entities/reservation.entity';
import { User, UserRole } from '../modules/auth/entities/user.entity';

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  console.log('DB conectada, sembrando…');

  const hotels = AppDataSource.getRepository(Hotel);
  const rooms = AppDataSource.getRepository(Room);
  const guests = AppDataSource.getRepository(Guest);
  const reservations = AppDataSource.getRepository(Reservation);
  const users = AppDataSource.getRepository(User);

  // ── Admin (idempotente, credenciales por env) ──
  const adminEmail = env.admin.email.toLowerCase();
  const adminExists = await users.findOneBy({ email: adminEmail });
  if (!adminExists) {
    await users.save(
      users.create({
        email: adminEmail,
        passwordHash: await bcrypt.hash(env.admin.password, env.bcryptRounds),
        role: UserRole.ADMIN,
      }),
    );
    console.log(`Admin creado: ${adminEmail}`);
  }

  // ── Hoteles ──
  const hotelSeeds = [
    {
      name: 'Hotel Central Madrid',
      city: 'Madrid',
      description: 'Hotel de prueba en el centro',
      rating: 4.5,
    },
    {
      name: 'Hotel Costa Azul',
      city: 'Barcelona',
      description: 'Hotel de prueba junto al mar',
      rating: 4.0,
    },
  ];
  for (const seed of hotelSeeds) {
    const exists = await hotels.findOne({
      where: { name: seed.name, city: seed.city },
    });
    if (!exists) {
      await hotels.save(hotels.create(seed));
      console.log(`Hotel creado: ${seed.name}`);
    }
  }
  const madrid = await hotels.findOneByOrFail({ name: 'Hotel Central Madrid' });

  // ── Habitaciones (hotel Madrid) ──
  const roomSeeds = [
    { number: '101', type: RoomType.SINGLE, basePrice: 80, capacity: 1 },
    { number: '102', type: RoomType.DOUBLE, basePrice: 120, capacity: 2 },
    { number: '201', type: RoomType.SUITE, basePrice: 250, capacity: 4 },
  ];
  for (const seed of roomSeeds) {
    const exists = await rooms.findOne({
      where: { number: seed.number, hotel: { id: madrid.id } },
    });
    if (!exists) {
      await rooms.save(rooms.create({ ...seed, hotel: madrid }));
      console.log(`Habitación creada: ${seed.number}`);
    }
  }

  // ── Huéspedes ──
  const guestSeeds = [
    {
      fullName: 'Ana García',
      email: 'ana.garcia@example.com',
      phone: '+34600000001',
      documentType: 'DNI',
      documentNumber: '11111111A',
    },
    {
      fullName: 'Bruno López',
      email: 'bruno.lopez@example.com',
      phone: '+34600000002',
      documentType: 'NIE',
      documentNumber: 'X1111111B',
    },
  ];
  for (const seed of guestSeeds) {
    const exists = await guests.findOneBy({ email: seed.email });
    if (!exists) {
      await guests.save(guests.create(seed));
      console.log(`Huésped creado: ${seed.email}`);
    }
  }

  // ── Reserva de ejemplo (30–33 días en el futuro) ──
  const room101 = await rooms.findOneByOrFail({ number: '101' });
  const ana = await guests.findOneByOrFail({ email: 'ana.garcia@example.com' });
  const checkIn = futureDate(30);
  const checkOut = futureDate(33);
  const existing = await reservations.findOne({
    where: {
      room: { id: room101.id },
      guest: { id: ana.id },
      checkIn,
    },
  });
  if (!existing) {
    await reservations.save(
      reservations.create({
        room: room101,
        guest: ana,
        checkIn,
        checkOut,
        numGuests: 1,
        status: ReservationStatus.PENDING,
        totalPrice: room101.basePrice * 3,
      }),
    );
    console.log(`Reserva creada: 101 ${checkIn} → ${checkOut}`);
  }

  await AppDataSource.destroy();
  console.log('Seed OK');
}

main().catch(async (err) => {
  console.error('Seed FAILED:', err);
  try {
    await AppDataSource.destroy();
  } catch {
    // ignorar error de cierre
  }
  process.exit(1);
});
