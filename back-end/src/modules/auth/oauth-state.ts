import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { HttpException, HttpStatus } from '@nestjs/common';

const STATE_TTL_MS = 10 * 60 * 1000;
const CALLBACK_SUFFIX = '/auth/callback';
const FALLBACK_SECRET = 'dev-jwt-secret-cademetro-2026';

interface OauthStatePayload {
  n: string;
  r?: string;
  e: number;
}

function stateSecret(): string {
  return process.env.JWT_SECRET ?? FALLBACK_SECRET;
}

export function createOauthState(returnUrl?: string): string {
  const payload: OauthStatePayload = {
    n: randomBytes(16).toString('hex'),
    e: Date.now() + STATE_TTL_MS,
  };
  if (returnUrl) {
    payload.r = returnUrl;
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', stateSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function parseOauthState(state: string): OauthStatePayload | null {
  const dot = state.lastIndexOf('.');
  if (dot <= 0) {
    return null;
  }

  const encoded = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  if (!encoded || !sig) {
    return null;
  }

  const expected = createHmac('sha256', stateSecret()).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as OauthStatePayload;
    if (
      !payload ||
      typeof payload.n !== 'string' ||
      typeof payload.e !== 'number' ||
      (payload.r !== undefined && typeof payload.r !== 'string')
    ) {
      return null;
    }
    if (payload.e <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.search || parsed.hash) {
      return false;
    }

    const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();

    if (scheme === 'cademetro') {
      return parsed.hostname === 'auth' && normalizePath(parsed.pathname) === '/callback';
    }

    if (scheme === 'exp') {
      return isCallbackPath(parsed.pathname);
    }

    if (scheme === 'http' || scheme === 'https') {
      const host = parsed.hostname.toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      return isLocal && isCallbackPath(parsed.pathname);
    }

    return false;
  } catch {
    return false;
  }
}

export function sanitizeOauthError(error: string): string {
  const normalized = error.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!normalized || normalized.length > 64) {
    return 'access_denied';
  }
  return normalized;
}

export function mapGoogleSignInError(err: unknown): string {
  if (err instanceof HttpException) {
    const status = err.getStatus();
    const message = err.message.toLowerCase();
    if (status === HttpStatus.FORBIDDEN) {
      return 'account_suspended';
    }
    if (status === HttpStatus.CONFLICT) {
      return 'email_in_use';
    }
    if (status === HttpStatus.BAD_GATEWAY || status === HttpStatus.SERVICE_UNAVAILABLE) {
      return 'google_unavailable';
    }
    if (status === HttpStatus.UNAUTHORIZED) {
      if (message.includes('not verified')) {
        return 'email_unverified';
      }
      return 'access_denied';
    }
  }
  if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return 'google_unavailable';
  }
  return 'access_denied';
}

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }
  return pathname.replace(/\/+$/, '') || '/';
}

function isCallbackPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === CALLBACK_SUFFIX || path.endsWith(CALLBACK_SUFFIX);
}
