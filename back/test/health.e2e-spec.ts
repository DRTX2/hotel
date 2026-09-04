import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health/live → 200 sin depender de la DB', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/health/live')
      .expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /v1/health/ready → 200 con DB disponible', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/health/ready')
      .expect(200);
    expect(res.body).toEqual({
      status: 'ok',
      checks: { database: 'up' },
    });
  });
});
