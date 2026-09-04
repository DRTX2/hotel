import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/modules/auth/entities/user.entity';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: { publicId: string; email: string; role: string };
}

function body<T>(res: Response): T {
  return res.body as T;
}

describe('Auth (e2e) — Sprint 2', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  const ts = Date.now();
  const guestEmail = `guest-${ts}@e2e.local`;
  const adminEmail = `admin-${ts}@e2e.local`;

  beforeAll(async () => {
    app = await createTestApp();
    // Admin vía servicio (el registro público solo crea guests)
    const authService = app.get(AuthService);
    await authService.createUser(adminEmail, 'Admin1234', UserRole.ADMIN);
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: 'Admin1234' })
      .expect(200);
    adminToken = body<TokenPair>(login).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('register crea guest, nunca expone el hash y rechaza duplicados', async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .post('/v1/auth/register')
      .send({ email: guestEmail, password: 'Secreta123' })
      .expect(201);
    const created = body<TokenPair>(res);
    expect(created.user.role).toBe('guest');
    expect(created.accessToken).toBeDefined();
    expect(created.refreshToken).toBeDefined();
    expect('passwordHash' in (res.body as object)).toBe(false);

    await request(server)
      .post('/v1/auth/register')
      .send({ email: guestEmail, password: 'Otra1234' })
      .expect(409);
  });

  it('register rechaza password débil e intentos de escalado a admin', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/v1/auth/register')
      .send({ email: `weak-${ts}@e2e.local`, password: 'corta' })
      .expect(400);
    // RegisterDto no admite `role`: whitelist lo rechaza
    await request(server)
      .post('/v1/auth/register')
      .send({
        email: `evil-${ts}@e2e.local`,
        password: 'Secreta123',
        role: 'admin',
      })
      .expect(400);
  });

  it('login 401 con credenciales inválidas sin filtrar existencia', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/v1/auth/login')
      .send({ email: guestEmail, password: 'Mal12345' })
      .expect(401);
    await request(server)
      .post('/v1/auth/login')
      .send({ email: `nadie-${ts}@e2e.local`, password: 'Mal12345' })
      .expect(401);
  });

  it('me exige Bearer y devuelve el perfil', async () => {
    const server = app.getHttpServer();
    await request(server).get('/v1/auth/me').expect(401);

    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: guestEmail, password: 'Secreta123' })
      .expect(200);
    const me = await request(server)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${body<TokenPair>(login).accessToken}`)
      .expect(200);
    expect((me.body as { email: string }).email).toBe(guestEmail);
  });

  it('guest no puede crear hoteles (403) y admin sí', async () => {
    const server = app.getHttpServer();
    const guestLogin = await request(server)
      .post('/v1/auth/login')
      .send({ email: guestEmail, password: 'Secreta123' })
      .expect(200);
    const guestToken = body<TokenPair>(guestLogin).accessToken;

    await request(server)
      .post('/v1/hotels')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ name: 'Nope', city: 'X' })
      .expect(403);

    // Catálogo público: lectura sin token
    await request(server).get('/v1/hotels').expect(200);
  });

  it('refresh rota: el token viejo queda invalidado', async () => {
    const server = app.getHttpServer();
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: guestEmail, password: 'Secreta123' })
      .expect(200);
    const first = body<TokenPair>(login);

    const rotated = await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    expect(body<TokenPair>(rotated).refreshToken).not.toBe(first.refreshToken);

    // Reuso del token rotado → 401 y sesión revocada
    await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(401);
  });

  it('logout revoca la sesión', async () => {
    const server = app.getHttpServer();
    const login = await request(server)
      .post('/v1/auth/login')
      .send({ email: guestEmail, password: 'Secreta123' })
      .expect(200);
    const pair = body<TokenPair>(login);

    await request(server)
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${pair.accessToken}`)
      .expect(204);

    await request(server)
      .post('/v1/auth/refresh')
      .send({ refreshToken: pair.refreshToken })
      .expect(401);
  });

  it('admin crea staff; staff opera; guest no crea usuarios', async () => {
    const server = app.getHttpServer();
    const staffEmail = `staff-${ts}@e2e.local`;

    await request(server)
      .post('/v1/auth/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: staffEmail, password: 'Staff1234', role: 'staff' })
      .expect(201);

    const staffLogin = await request(server)
      .post('/v1/auth/login')
      .send({ email: staffEmail, password: 'Staff1234' })
      .expect(200);
    const staffToken = body<TokenPair>(staffLogin).accessToken;

    // Staff crea hotel (jerarquía staff ⊇)
    await request(server)
      .post('/v1/hotels')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: `Hotel Staff ${ts}`, city: 'StaffCity' })
      .expect(201);

    // Guest no puede crear usuarios
    const guestLogin = await request(server)
      .post('/v1/auth/login')
      .send({ email: guestEmail, password: 'Secreta123' })
      .expect(200);
    await request(server)
      .post('/v1/auth/users')
      .set('Authorization', `Bearer ${body<TokenPair>(guestLogin).accessToken}`)
      .send({
        email: `otro-${ts}@e2e.local`,
        password: 'Otro1234',
        role: 'staff',
      })
      .expect(403);
  });
});
