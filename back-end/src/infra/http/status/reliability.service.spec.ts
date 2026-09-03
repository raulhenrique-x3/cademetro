import { describe, it, expect, beforeEach } from 'vitest';
import { ReliabilityService } from './reliability.service.js';

describe('ReliabilityService', () => {
  let service: ReliabilityService;

  beforeEach(() => {
    service = new ReliabilityService();
  });

  describe('freshness (f_age)', () => {
    it('returns 1.0 for brand new report (elapsed = 0)', () => {
      const now = new Date('2026-09-03T12:00:00.000Z');
      const createdAt = new Date('2026-09-03T12:00:00.000Z');
      expect(service.calculateFreshness(createdAt, now)).toBe(1.0);
    });

    it('returns 0.5 for 15-minute-old report', () => {
      const now = new Date('2026-09-03T12:15:00.000Z');
      const createdAt = new Date('2026-09-03T12:00:00.000Z');
      expect(service.calculateFreshness(createdAt, now)).toBe(0.5);
    });

    it('returns 0.0 for 30-minute-old report', () => {
      const now = new Date('2026-09-03T12:30:00.000Z');
      const createdAt = new Date('2026-09-03T12:00:00.000Z');
      expect(service.calculateFreshness(createdAt, now)).toBe(0.0);
    });

    it('clamps to 0.0 for reports older than window (> 30 min)', () => {
      const now = new Date('2026-09-03T13:00:00.000Z');
      const createdAt = new Date('2026-09-03T12:00:00.000Z');
      expect(service.calculateFreshness(createdAt, now)).toBe(0.0);
    });
  });

  describe('confirmation balance (f_conf)', () => {
    it('returns 0.5 for neutral unconfirmed report (0 confirms, 0 disputes)', () => {
      expect(service.calculateConfirmationBalance(0, 0)).toBe(0.5);
    });

    it('returns 1.0 for 1 confirm, 0 disputes', () => {
      expect(service.calculateConfirmationBalance(1, 0)).toBe(1.0);
    });

    it('returns ~0.333 for 1 confirm, 1 dispute', () => {
      expect(service.calculateConfirmationBalance(1, 1)).toBeCloseTo(1 / 3, 4);
    });

    it('returns 0.0 for 0 confirms, 1 dispute', () => {
      expect(service.calculateConfirmationBalance(0, 1)).toBe(0.0);
    });

    it('returns 1.0 for multiple confirms and 0 disputes', () => {
      expect(service.calculateConfirmationBalance(5, 0)).toBe(1.0);
    });
  });

  describe('author trust (f_trust)', () => {
    it('returns 0.5 for new author with no report history', () => {
      expect(service.calculateAuthorTrust(0, 0)).toBe(0.5);
    });

    it('returns 0.8 for author with 3 confirmed reports and 0 disputed', () => {
      expect(service.calculateAuthorTrust(3, 0)).toBe(0.8);
    });

    it('returns 0.2 for author with 0 confirmed reports and 3 disputed', () => {
      expect(service.calculateAuthorTrust(0, 3)).toBe(0.2);
    });
  });

  describe('confidence score blend', () => {
    it('computes expected confidence for a brand new unconfirmed report by a new author', () => {
      const now = new Date('2026-09-03T12:00:00.000Z');
      const createdAt = new Date('2026-09-03T12:00:00.000Z');

      // w_age = 0.40 * 1.0 = 0.40
      // w_conf = 0.35 * 0.5 = 0.175
      // w_trust = 0.25 * 0.5 = 0.125
      // total = 0.70
      const confidence = service.calculateConfidence({
        createdAt,
        confirms: 0,
        disputes: 0,
        authorTrust: 0.5,
        now,
      });

      expect(confidence).toBe(0.7);
    });

    it('computes higher confidence when confirmed and verified', () => {
      const now = new Date('2026-09-03T12:00:00.000Z');
      const createdAt = new Date('2026-09-03T12:00:00.000Z');

      // f_age = 1.0, f_conf = 1.0, f_trust = 0.8
      // 0.40*1 + 0.35*1 + 0.25*0.8 = 0.40 + 0.35 + 0.20 = 0.95
      const confidence = service.calculateConfidence({
        createdAt,
        confirms: 2,
        disputes: 0,
        authorTrust: 0.8,
        now,
      });

      expect(confidence).toBe(0.95);
    });
  });
});
