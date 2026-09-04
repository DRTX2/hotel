import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/modules/auth/entities/user.entity';

function future(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

interface PublicIdBody {
  publicId: string;
}

interface ReservationBody extends PublicIdBody {
  totalPrice: number;
  status: string;
}

interface RoomBody extends PublicIdBody {
  status: string;
}

interface PageBody<T> {
  data: T[];
}

interface CancelBody {
  reservation: ReservationBody;
  refundPercent: number;
}

interface LoginBody {
  accessToken: string;
}

function body<T>(res: Response): T {
  return res.body as T;
}

describe('Booking (e2e) — Sprint 1', () => {
  let app: INestApplication<App>;
  let staffHeader: string;
  let hotelId: string;
  let roomId: string;
  let guestId: string;

  const checkIn = future(30);
  const checkOut = future(33); // 3 noches

  const authed = (req: request.Test): request.Test =>
    req.set('Authorization', staffHeader);

  beforeAll(async () => {
    app = await createTestApp();
    const server = app.getHttpServer();

    // Staff vía servicio + login HTTP (los writes exigen staff+)
    const ts = Date.now();
    const authService = app.get(AuthService);
    await authService.createUser(
      `booking-staff-${ts}@e2e.local`,
      'Staff1234',
      UserRole.STAFF,
    );
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: `booking-staff-${ts}@e2e.local`, password: 'Staff1234' })
      .expect(200);
    staffHeader = `Bearer ${body<LoginBody>(login).accessToken}`;

    const hotel = await authed(
      request(server)
        .post('/v1/hotels')
        .send({ name: 'Hotel E2E', city: 'TestCity', rating: 4 }),
    ).expect(201);
    hotelId = body<PublicIdBody>(hotel).publicId;

    const room = await authed(
      request(server).post('/v1/rooms').send({
        hotelPublicId: hotelId,
        number: 'E2E-101',
        status: 'AVAILABLE',
        type: 'DOUBLE',
        basePrice: 100,
        capacity: 2,
      }),
    ).expect(201);
    roomId = body<PublicIdBody>(room).publicId;

    const guest = await authed(
      request(server)
        .post('/v1/guests')
        .send({
          fullName: 'E2E Guest',
          email: `e2e-${ts}@example.com`,
          documentType: 'DNI',
          documentNumber: `E2E${ts}`,
        }),
    ).expect(201);
    guestId = body<PublicIdBody>(guest).publicId;
  });

  afterAll(async () => {
    // Limpieza: el DELETE de hotel cae en cascada a rooms+reservations
    const server = app.getHttpServer();
    if (hotelId) await authed(request(server).delete(`/v1/hotels/${hotelId}`));
    if (guestId) await authed(request(server).delete(`/v1/guests/${guestId}`));
    await app.close();
  });

  it('crea la reserva con precio = noches × basePrice', async () => {
    const res = await authed(
      request(app.getHttpServer()).post('/v1/reservations').send({
        roomPublicId: roomId,
        guestPublicId: guestId,
        checkIn,
        checkOut,
        numGuests: 2,
      }),
    ).expect(201);
    const created = body<ReservationBody>(res);
    expect(created.totalPrice).toBe(300);
    expect(created.status).toBe('PENDING');
  });

  it('rechaza solape con 409', async () => {
    await authed(
      request(app.getHttpServer())
        .post('/v1/reservations')
        .send({
          roomPublicId: roomId,
          guestPublicId: guestId,
          checkIn: future(31),
          checkOut: future(34),
          numGuests: 1,
        }),
    ).expect(409);
  });

  it('rechaza exceso de capacidad y rango inválido con 400', async () => {
    const server = app.getHttpServer();
    await authed(
      request(server).post('/v1/reservations').send({
        roomPublicId: roomId,
        guestPublicId: guestId,
        checkIn,
        checkOut,
        numGuests: 5,
      }),
    ).expect(400);
    await authed(
      request(server).post('/v1/reservations').send({
        roomPublicId: roomId,
        guestPublicId: guestId,
        checkIn: checkOut,
        checkOut: checkIn,
        numGuests: 1,
      }),
    ).expect(400);
  });

  it('sin token la API responde 401 en writes', async () => {
    await request(app.getHttpServer())
      .post('/v1/reservations')
      .send({
        roomPublicId: roomId,
        guestPublicId: guestId,
        checkIn,
        checkOut,
        numGuests: 1,
      })
      .expect(401);
  });

  it('disponibilidad excluye la habitación ocupada e incluye otro rango', async () => {
    const server = app.getHttpServer();
    const busy = await request(server)
      .get('/v1/rooms/available')
      .query({ checkIn: future(31), checkOut: future(32), guests: 1 })
      .expect(200);
    expect(
      body<PageBody<PublicIdBody>>(busy).data.some(
        (r) => r.publicId === roomId,
      ),
    ).toBe(false);

    const free = await request(server)
      .get('/v1/rooms/available')
      .query({ checkIn: future(40), checkOut: future(42), guests: 1 })
      .expect(200);
    expect(
      body<PageBody<PublicIdBody>>(free).data.some(
        (r) => r.publicId === roomId,
      ),
    ).toBe(true);
  });

  it('flujo completo: update → check-in → check-out → cancel', async () => {
    const server = app.getHttpServer();

    const list = await authed(request(server).get('/v1/reservations')).expect(
      200,
    );
    const reservationId =
      body<PageBody<ReservationBody>>(list).data[0].publicId;

    const updated = await authed(
      request(server)
        .patch(`/v1/reservations/${reservationId}`)
        .send({ checkIn: future(30), checkOut: future(32), numGuests: 1 }),
    ).expect(200);
    expect(body<ReservationBody>(updated).totalPrice).toBe(200);

    const inRes = await authed(
      request(server).post(`/v1/reservations/${reservationId}/check-in`),
    ).expect(200);
    expect(body<ReservationBody>(inRes).status).toBe('PAID');

    const room = await request(server).get(`/v1/rooms/${roomId}`).expect(200);
    expect(body<RoomBody>(room).status).toBe('OCCUPIED');

    await authed(
      request(server).post(`/v1/reservations/${reservationId}/check-out`),
    ).expect(200);
    const freed = await request(server).get(`/v1/rooms/${roomId}`).expect(200);
    expect(body<RoomBody>(freed).status).toBe('AVAILABLE');

    const cancelled = await authed(
      request(server).post(`/v1/reservations/${reservationId}/cancel`),
    ).expect(200);
    const cancelBody = body<CancelBody>(cancelled);
    expect(cancelBody.reservation.status).toBe('CANCELLED');
    expect(cancelBody.refundPercent).toBe(100);
  });
});
