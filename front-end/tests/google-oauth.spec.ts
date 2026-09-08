import { describe, it, expect, beforeEach } from 'vitest';
import { authApi, parseGoogleOAuthError } from '../src/api/auth';
import { storage, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../src/lib/storage';
import { apiClient, API_BASE_URL } from '../src/api/client';

describe('Google OAuth Front-end Integration', () => {
  beforeEach(() => {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    delete apiClient.defaults.headers.common.Authorization;
  });

  describe('authApi.getGoogleAuthUrl', () => {
    it('generates the default Google auth endpoint', () => {
      const url = authApi.getGoogleAuthUrl();
      const expectedBase = API_BASE_URL.replace(/\/+$/, '');
      expect(url).toBe(`${expectedBase}/auth/google`);
    });

    it('attaches returnUrl query parameter when provided', () => {
      const returnUrl = 'cademetro://auth/callback';
      const url = authApi.getGoogleAuthUrl(returnUrl);
      const parsed = new URL(url);

      expect(parsed.pathname).toBe('/auth/google');
      expect(parsed.searchParams.get('returnUrl')).toBe(returnUrl);
    });

    it('handles web returnUrl correctly', () => {
      const webReturnUrl = 'http://localhost:8081/auth/callback';
      const url = authApi.getGoogleAuthUrl(webReturnUrl);
      const parsed = new URL(url);

      expect(parsed.searchParams.get('returnUrl')).toBe(webReturnUrl);
    });
  });

  describe('parseGoogleOAuthError', () => {
    it('translates access_denied error', () => {
      const msg = parseGoogleOAuthError('access_denied');
      expect(msg).toContain('Acesso cancelado ou não autorizado pelo Google');
    });

    it('translates invalid_state error', () => {
      const msg = parseGoogleOAuthError('invalid_state');
      expect(msg).toContain('Sessão de autenticação expirada');
    });

    it('translates account suspended error', () => {
      const msg = parseGoogleOAuthError('account_suspended');
      expect(msg).toContain('Esta conta está suspensa');
    });

    it('translates email conflict error', () => {
      const msg = parseGoogleOAuthError('email_in_use');
      expect(msg).toContain('já está vinculado a outra conta');
    });

    it('handles null or empty errors gracefully', () => {
      expect(parseGoogleOAuthError(null)).toContain('Falha na autenticação com o Google');
      expect(parseGoogleOAuthError('')).toContain('Falha na autenticação com o Google');
    });

    it('formats unknown errors with the code', () => {
      const msg = parseGoogleOAuthError('server_error_500');
      expect(msg).toContain('server_error_500');
    });
  });

  describe('OAuth token management', () => {
    it('saves accessToken and refreshToken to cross-platform storage', () => {
      const fakeTokens = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakeAccess',
        refreshToken: 'fake-refresh-token-uuid-1234',
      };

      storage.setItem(AUTH_TOKEN_KEY, fakeTokens.accessToken);
      storage.setItem(REFRESH_TOKEN_KEY, fakeTokens.refreshToken);

      expect(storage.getItem(AUTH_TOKEN_KEY)).toBe(fakeTokens.accessToken);
      expect(storage.getItem(REFRESH_TOKEN_KEY)).toBe(fakeTokens.refreshToken);
    });

    it('attaches Bearer token in request headers for apiClient', () => {
      const fakeToken = 'test-bearer-token';
      storage.setItem(AUTH_TOKEN_KEY, fakeToken);

      // Verify interceptor sets Authorization
      const config = (apiClient.interceptors.request as any).handlers[0].fulfilled({
        headers: {},
      });

      expect(config.headers.Authorization).toBe(`Bearer ${fakeToken}`);
    });
  });

  describe('OAuth redirect URL parsing', () => {
    it('extracts tokens from success redirect query params', () => {
      const redirectUrl =
        'cademetro://auth/callback?accessToken=mock-access-token&refreshToken=mock-refresh-token';
      const parsed = new URL(redirectUrl.replace('cademetro://', 'http://cademetro/'));

      const accessToken = parsed.searchParams.get('accessToken');
      const refreshToken = parsed.searchParams.get('refreshToken');
      const error = parsed.searchParams.get('error');

      expect(accessToken).toBe('mock-access-token');
      expect(refreshToken).toBe('mock-refresh-token');
      expect(error).toBeNull();
    });

    it('extracts error from failure redirect query params', () => {
      const redirectUrl = 'cademetro://auth/callback?error=invalid_state';
      const parsed = new URL(redirectUrl.replace('cademetro://', 'http://cademetro/'));

      const error = parsed.searchParams.get('error');
      expect(error).toBe('invalid_state');
      expect(parseGoogleOAuthError(error)).toContain('Sessão de autenticação expirada');
    });
  });
});
