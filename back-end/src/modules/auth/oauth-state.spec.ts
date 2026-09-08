import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createOauthState,
  isValidRedirectUrl,
  mapGoogleSignInError,
  parseOauthState,
  sanitizeOauthError,
} from './oauth-state.js';

describe('oauth-state', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-oauth-secret';
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
    vi.useRealTimers();
  });

  describe('createOauthState / parseOauthState', () => {
    it('round-trips nonce, expiry and returnUrl', () => {
      const returnUrl = 'cademetro://auth/callback';
      const state = createOauthState(returnUrl);
      const parsed = parseOauthState(state);

      expect(parsed).not.toBeNull();
      expect(parsed!.n).toMatch(/^[a-f0-9]{32}$/);
      expect(parsed!.r).toBe(returnUrl);
      expect(parsed!.e).toBeGreaterThan(Date.now());
    });

    it('omits returnUrl when not provided', () => {
      const parsed = parseOauthState(createOauthState());
      expect(parsed).not.toBeNull();
      expect(parsed!.r).toBeUndefined();
    });

    it('rejects a tampered payload', () => {
      const state = createOauthState('cademetro://auth/callback');
      const [payload, sig] = state.split('.');
      const tampered = Buffer.from('{"n":"00","e":9999999999999}', 'utf8').toString('base64url');
      expect(parseOauthState(`${tampered}.${sig}`)).toBeNull();
      expect(parseOauthState(`${payload}.aaaaaaaa`)).toBeNull();
    });

    it('rejects an expired state', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const state = createOauthState();
      vi.setSystemTime(new Date('2026-01-01T00:11:00.000Z'));
      expect(parseOauthState(state)).toBeNull();
    });

    it('rejects malformed state strings', () => {
      expect(parseOauthState('')).toBeNull();
      expect(parseOauthState('nosig')).toBeNull();
      expect(parseOauthState('.sig')).toBeNull();
    });
  });

  describe('isValidRedirectUrl', () => {
    it('accepts production and Expo callback URLs', () => {
      expect(isValidRedirectUrl('cademetro://auth/callback')).toBe(true);
      expect(isValidRedirectUrl('exp://192.168.0.5:8081/--/auth/callback')).toBe(true);
      expect(isValidRedirectUrl('http://localhost:8081/auth/callback')).toBe(true);
      expect(isValidRedirectUrl('http://127.0.0.1:8081/auth/callback')).toBe(true);
    });

    it('rejects open redirects and unsafe schemes', () => {
      expect(isValidRedirectUrl('https://evil.example/auth/callback')).toBe(false);
      expect(isValidRedirectUrl('http://evil.example/auth/callback')).toBe(false);
      expect(isValidRedirectUrl('cademetro://other/callback')).toBe(false);
      expect(isValidRedirectUrl('javascript:alert(1)')).toBe(false);
      expect(isValidRedirectUrl('cademetro://auth/callback?x=1')).toBe(false);
      expect(isValidRedirectUrl('not a url')).toBe(false);
    });
  });

  describe('sanitizeOauthError', () => {
    it('keeps google error codes and strips unsafe characters', () => {
      expect(sanitizeOauthError('access_denied')).toBe('access_denied');
      expect(sanitizeOauthError(' <script> ')).toBe('script');
      expect(sanitizeOauthError('')).toBe('access_denied');
    });
  });

  describe('mapGoogleSignInError', () => {
    it('maps nest exceptions to oauth error codes', () => {
      expect(mapGoogleSignInError(new ForbiddenException('Account is suspended'))).toBe(
        'account_suspended',
      );
      expect(mapGoogleSignInError(new ConflictException('Email is already linked'))).toBe(
        'email_in_use',
      );
      expect(mapGoogleSignInError(new BadGatewayException('Failed'))).toBe('google_unavailable');
      expect(mapGoogleSignInError(new ServiceUnavailableException('Not configured'))).toBe(
        'google_unavailable',
      );
      expect(mapGoogleSignInError(new UnauthorizedException('Google email is not verified'))).toBe(
        'email_unverified',
      );
      expect(mapGoogleSignInError(new UnauthorizedException('Invalid Google profile'))).toBe(
        'access_denied',
      );
    });

    it('maps abort/timeout to google_unavailable', () => {
      const abort = new Error('aborted');
      abort.name = 'AbortError';
      expect(mapGoogleSignInError(abort)).toBe('google_unavailable');
    });
  });
});
