import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app/app.module.js';

describe('CadêMetrô E2E Flows', () => {
  let app: INestApplication<App>;
  const timestamp = Date.now();
  const testEmail = `passenger_${timestamp}@example.com`;
  const secondUserEmail = `second_user_${timestamp}@example.com`;
  const testPassword = 'password123';

  let userToken: string;
  let secondUserToken: string;
  let moderatorToken: string;
  let createdReportId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Metro Infrastructure (Public)', () => {
    it('/lines (GET) - lists all metro lines', async () => {
      const res = await request(app.getHttpServer())
        .get('/lines')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('code');
      expect(res.body[0]).toHaveProperty('color');
      expect(res.body[0]).toHaveProperty('directions');
    });

    it('/lines/:id (GET) - returns line details with ordered stations', async () => {
      const res = await request(app.getHttpServer())
        .get('/lines/1')
        .expect(200);

      expect(res.body.id).toBe(1);
      expect(Array.isArray(res.body.stations)).toBe(true);
      expect(res.body.stations.length).toBeGreaterThan(0);
      expect(res.body.stations[0]).toHaveProperty('order');
    });

    it('/stations (GET) - lists stations with line information', async () => {
      const res = await request(app.getHttpServer())
        .get('/stations?lineId=1')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('latitude');
      expect(res.body[0]).toHaveProperty('longitude');
      expect(res.body[0]).toHaveProperty('lines');
    });
  });

  describe('Authentication Flow', () => {
    it('/auth/register (POST) - creates new user account and returns id with success message', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          username: `user_${timestamp}`,
          name: 'E2E Test User',
        })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(Number),
        message: 'Account created successfully',
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      userToken = loginRes.body.accessToken;
    });

    it('/auth/register (POST) - rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(409);

      expect(res.body).toMatchObject({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email already registered',
      });
      expect(res.body).toHaveProperty('path');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('/auth/login (POST) - logs in successfully and returns token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).not.toHaveProperty('user');
    });

    it('/auth/refresh (POST) - rotates refresh token and revokes the old one', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);

      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).not.toBe(loginRes.body.refreshToken);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(401);
    });

    it('/auth/logout (POST) - revokes the refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully');

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(401);
    });

    it('/auth/login (POST) - rejects invalid password with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrongPassword123',
        })
        .expect(401);

      expect(res.body).toMatchObject({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    });

    it('/auth/me (GET) - retrieves current user with valid Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.email).toBe(testEmail);
      expect(res.body.trustScore).toBe(0.5);
    });

    it('/auth/me (GET) - rejects request without token with 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Reports Flow & Validations', () => {
    it('/reports (POST) - rejects invalid scope with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'TRAIN_ARRIVING',
          lineId: 1,
          // Missing stationId and directionId
        })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('/reports (POST) - creates an operational restriction report', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'OPERATIONAL_RESTRICTION',
          lineId: 1,
          description: 'Velocidade reduzida devido à chuva',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('OPERATIONAL_RESTRICTION');
      expect(res.body.lineId).toBe(1);
      expect(res.body.lineCode).toBe('1-azul');
      expect(res.body.confidence).toBeGreaterThan(0);
      expect(res.body.confirmations).toEqual({ confirm: 0, dispute: 0 });

      createdReportId = res.body.id;
    });

    it('/reports/recent (GET) - returns recent non-hidden reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/recent?lineId=1')
        .expect(200);

      expect(res.body).toHaveProperty('reports');
      expect(res.body).toHaveProperty('total');
      expect(res.body.reports.some((r: any) => r.id === createdReportId)).toBe(true);
    });

    it('/reports/:id (GET) - retrieves report details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/${createdReportId}`)
        .expect(200);

      expect(res.body.id).toBe(createdReportId);
      expect(res.body.type).toBe('OPERATIONAL_RESTRICTION');
    });
  });

  describe('Confirmations & Toggle Flow', () => {
    beforeAll(async () => {
      // Register second user and log in
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: secondUserEmail,
          password: testPassword,
          username: `confirmer_${timestamp}`,
        });
      expect(res.status).toBe(201);

      const secondLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: secondUserEmail,
          password: testPassword,
        });
      secondUserToken = secondLogin.body.accessToken;

      // Login moderator seeded user
      const modRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'moderator@cademetro.com',
          password: 'moderator123',
        });
      moderatorToken = modRes.body.accessToken;
    });

    it('/reports/:id/confirm (POST) - author cannot confirm their own report', async () => {
      const res = await request(app.getHttpServer())
        .post(`/reports/${createdReportId}/confirm`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('/reports/:id/confirm (POST) - second user confirms report', async () => {
      const res = await request(app.getHttpServer())
        .post(`/reports/${createdReportId}/confirm`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);

      expect(res.body.confirmations.confirm).toBe(1);
      expect(res.body.confirmations.dispute).toBe(0);
    });

    it('/reports/:id/confirm (POST) - second user toggles confirmation off', async () => {
      const res = await request(app.getHttpServer())
        .post(`/reports/${createdReportId}/confirm`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);

      expect(res.body.confirmations.confirm).toBe(0);
    });

    it('/reports/:id/dispute (POST) - second user disputes report', async () => {
      const res = await request(app.getHttpServer())
        .post(`/reports/${createdReportId}/dispute`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);

      expect(res.body.confirmations.dispute).toBe(1);
      expect(res.body.confirmations.confirm).toBe(0);
    });
  });

  describe('Operational Status Aggregation', () => {
    it('/status (GET) - derives RESTRICTED status for Line 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/status?lineId=1')
        .expect(200);

      expect(res.body.lineId).toBe(1);
      expect(res.body.status).toBe('RESTRICTED');
      expect(res.body.reports.length).toBeGreaterThan(0);
    });
  });

  describe('Realtime SSE Events', () => {
    it('emits events through EventsService when reports are created', async () => {
      const { EventsService } = await import('../src/modules/events/events.service.js');
      const eventsService = app.get(EventsService);
      const stream$ = eventsService.subscribe({ lineId: 1 });

      const eventPromise = new Promise<any>((resolve) => {
        const sub = stream$.subscribe((e) => {
          if (e.type === 'report.created') {
            sub.unsubscribe();
            resolve(e);
          }
        });
      });

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'NORMAL_OPERATION',
          lineId: 1,
          description: 'Operação normalizada',
        })
        .expect(201);

      const received = await eventPromise;
      expect(received.type).toBe('report.created');
      expect(received.data.type).toBe('NORMAL_OPERATION');
      expect(received.data.lineId).toBe(1);
    });
  });

  describe('Moderation Flow', () => {
    it('/reports/:id/hide (PATCH) - normal user cannot hide report (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/reports/${createdReportId}/hide`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'spam' })
        .expect(403);
    });

    it('/reports/:id/hide (PATCH) - moderator can hide report', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/reports/${createdReportId}/hide`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({ reason: 'Spam report' })
        .expect(200);

      expect(res.body.id).toBe(createdReportId);

      // Verify it is no longer returned in GET /reports/:id
      await request(app.getHttpServer())
        .get(`/reports/${createdReportId}`)
        .expect(404);
    });
  });
});
