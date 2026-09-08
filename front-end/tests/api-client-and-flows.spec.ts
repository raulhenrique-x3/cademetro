import { describe, it, expect } from 'vitest';
import { normalizeError, apiClient } from '../src/api/client';
import { metroApi } from '../src/api/metro';
import { statusApi } from '../src/api/status';
import { reportsApi } from '../src/api/reports';
import { authApi } from '../src/api/auth';
import { AxiosError } from 'axios';

describe('API Client, Error Normalization & Backend Integration', () => {
  describe('normalizeError', () => {
    it('normalizes 401 unauthorized to user friendly Portuguese message', () => {
      const error = {
        response: { status: 401, statusText: 'Unauthorized' },
        message: 'Request failed with status code 401',
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(401);
      expect(normalized.message).toContain('Sessão expirada');
    });

    it('normalizes 403 forbidden', () => {
      const error = {
        response: { status: 403, statusText: 'Forbidden' },
        message: 'Request failed with status code 403',
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(403);
      expect(normalized.message).toContain('não tem permissão');
    });

    it('normalizes 409 conflict to duplicate email message', () => {
      const error = {
        response: { status: 409, statusText: 'Conflict' },
        message: 'Request failed with status code 409',
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(409);
      expect(normalized.message).toContain('já está cadastrado');
    });

    it('normalizes 429 rate limit exceeded', () => {
      const error = {
        response: { status: 429, statusText: 'Too Many Requests' },
        message: 'Request failed with status code 429',
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(429);
      expect(normalized.message).toContain('Muitas tentativas');
    });

    it('preserves structured backend error response if available', () => {
      const backendError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed: email is invalid',
        path: '/auth/register',
        timestamp: new Date().toISOString(),
      };

      const error = {
        response: { status: 400, data: backendError },
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.message).toBe('Validation failed: email is invalid');
    });

    it('normalizes network disconnect when response is undefined', () => {
      const error = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(0);
      expect(normalized.message).toContain('Não foi possível conectar ao servidor');
    });

    it('normalizes request timeout', () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      } as AxiosError<any>;

      const normalized = normalizeError(error);
      expect(normalized.statusCode).toBe(408);
      expect(normalized.message).toContain('Tempo de conexão esgotado');
    });
  });

  describe('Live Backend Integration (port 8006)', () => {
    it('fetches lines successfully from backend', async () => {
      const lines = await metroApi.getLines();
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThanOrEqual(1);

      const firstLine = lines[0];
      expect(firstLine.id).toBeDefined();
      expect(firstLine.name).toBeDefined();
      expect(firstLine.color).toBeDefined();
      expect(Array.isArray(firstLine.directions)).toBe(true);
    });

    it('fetches operational status for lines', async () => {
      const statusList = await statusApi.getAllLinesStatus();
      expect(Array.isArray(statusList)).toBe(true);
      expect(statusList.length).toBeGreaterThanOrEqual(1);

      const firstStatus = statusList[0];
      expect(firstStatus.lineId).toBeDefined();
      expect(['NORMAL', 'RESTRICTED', 'INTERRUPTED', 'UNKNOWN']).toContain(firstStatus.status);
    });

    it('fetches recent reports feed', async () => {
      const data = await reportsApi.getRecent({ limit: 5 });
      expect(data).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(typeof data.total).toBe('number');
    });

    it('completes auth registration and login flow', async () => {
      const testEmail = `testuser_${Date.now()}@example.com`;
      const testPassword = 'Password123!';

      // Register
      const registerRes = await authApi.register({
        email: testEmail,
        password: testPassword,
        username: `user_${Date.now()}`,
        name: 'Test Runner',
      });
      expect(registerRes.id).toBeDefined();
      expect(registerRes.message).toBeDefined();

      // Login
      const loginRes = await authApi.login({
        email: testEmail,
        password: testPassword,
      });
      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.refreshToken).toBeDefined();

      // Set token for me endpoint
      apiClient.defaults.headers.common.Authorization = `Bearer ${loginRes.accessToken}`;
      const me = await authApi.getMe();
      expect(me.email).toBe(testEmail);
      expect(me.trustScore).toBeDefined();

      // Delete account (LGPD & Google Play account deletion compliance)
      const deleteRes = await authApi.deleteAccount();
      expect(deleteRes.message).toContain('sucesso');
    });

    it('rejects invalid credentials with 401 error response', async () => {
      try {
        await authApi.login({
          email: 'nonexistent@cademetro.com',
          password: 'WrongPassword123!',
        });
        expect.unreachable('Should have thrown 401 error');
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Invalid credentials');
      }
    });
  });
});
