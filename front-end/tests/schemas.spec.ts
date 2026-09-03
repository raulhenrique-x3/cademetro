import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  loginSchema,
  registerSchema,
  hideReportSchema,
} from '../src/api/schemas';

describe('Frontend Zod Validation Schemas', () => {
  describe('createReportSchema', () => {
    it('accepts valid train report with line, station, and direction', () => {
      const payload = {
        type: 'TRAIN_ARRIVING' as const,
        lineId: 1,
        stationId: 12,
        directionId: 2,
        description: 'Chegando na plataforma',
      };

      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects train report missing required stationId', () => {
      const payload = {
        type: 'TRAIN_ARRIVED' as const,
        lineId: 1,
        stationId: null,
        directionId: 2,
      };

      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('estação é obrigatória');
      }
    });

    it('rejects train report missing required directionId', () => {
      const payload = {
        type: 'TRAIN_DEPARTED' as const,
        lineId: 1,
        stationId: 10,
        directionId: null,
      };

      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('sentido é obrigatório');
      }
    });

    it('accepts operational restriction report with only lineId (station and direction optional)', () => {
      const payload = {
        type: 'OPERATIONAL_RESTRICTION' as const,
        lineId: 2,
        stationId: null,
        directionId: null,
        description: 'Velocidade reduzida em toda a linha',
      };

      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects report with invalid type', () => {
      const payload = {
        type: 'INVALID_TYPE' as any,
        lineId: 1,
      };

      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects description longer than 500 characters', () => {
      const payload = {
        type: 'OPERATIONAL_RESTRICTION' as const,
        lineId: 1,
        description: 'a'.repeat(501),
      };

      const result = createReportSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máximo 500 caracteres');
      }
    });
  });

  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('accepts valid registration payload with optional fields', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@example.com',
        password: 'securepassword123',
        username: 'newuser',
        name: 'New User',
      });
      expect(result.success).toBe(true);
    });

    it('accepts registration without optional fields', () => {
      const result = registerSchema.safeParse({
        email: 'newuser@example.com',
        password: 'securepassword123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('hideReportSchema', () => {
    it('accepts reason with at least 3 characters', () => {
      const result = hideReportSchema.safeParse({
        reason: 'Informação desatualizada',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty or very short reason', () => {
      const result = hideReportSchema.safeParse({
        reason: 'no',
      });
      expect(result.success).toBe(false);
    });
  });
});
