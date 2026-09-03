import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

vi.mock('../../infra/database/prisma/db.js', () => {
  const users: any[] = [];
  const refreshTokens: any[] = [];

  const User = {
    where: (criteria: any) => ({
      first: async () => users.find((u) => Object.entries(criteria).every(([k, v]) => u[k] === v)),
    }),
    create: async (data: any) => {
      const user = { id: users.length + 1, createdAt: '2026-09-03T12:00:00.000Z', ...data };
      users.push(user);
      return user;
    },
  };

  const RefreshToken = {
    where: (criteria: any) => ({
      first: async () =>
        refreshTokens.find((t) =>
          Object.entries(criteria).every(([k, v]) => t[k] === v),
        ),
      update: async (data: any) => {
        const token = refreshTokens.find((t) =>
          Object.entries(criteria).every(([k, v]) => t[k] === v),
        );
        if (token) Object.assign(token, data);
        return token;
      },
    }),
    create: async (data: any) => {
      const token = { id: refreshTokens.length + 1, ...data };
      refreshTokens.push(token);
      return token;
    },
  };

  return {
    db: {
      orm: {
        public: { User, RefreshToken },
      },
    },
    __refreshTokens: refreshTokens,
    __users: users,
  };
});

const dbModule = await import('../../infra/database/prisma/db.js');
const { db } = dbModule;

describe('AuthService', () => {
  let authService: AuthService;
  let jwtServiceMock: any;
  let usersServiceMock: any;

  beforeEach(async () => {
    dbModule.__refreshTokens.length = 0;
    dbModule.__users.length = 0;
    jwtServiceMock = {
      signAsync: vi.fn().mockResolvedValue('fake-access-token'),
    };
    usersServiceMock = {
      getUserTrustScore: vi.fn().mockResolvedValue(0.75),
    };
    authService = new AuthService(jwtServiceMock, usersServiceMock);

    const passwordHash = await bcrypt.hash('correctPassword', 10);
    await db.orm.public.User.create({
      email: 'passenger@example.com',
      passwordHash,
      username: null,
      name: null,
      role: 'USER',
      status: 'ACTIVE',
    });
  });

  describe('register', () => {
    it('returns only id and success message', async () => {
      const result = await authService.register({
        email: 'new-user@example.com',
        password: 'mySecretPassword123',
      });

      expect(result).toEqual({
        id: 2,
        message: 'Account created successfully',
      });
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('hashes the password before storing', async () => {
      await authService.register({
        email: 'new-user@example.com',
        password: 'mySecretPassword123',
      });

      const stored = dbModule.__users.find((u: any) => u.email === 'new-user@example.com');
      expect(stored.passwordHash).not.toBe('mySecretPassword123');
      expect(await bcrypt.compare('mySecretPassword123', stored.passwordHash)).toBe(true);
    });
  });

  describe('login', () => {
    it('returns only access and refresh tokens', async () => {
      const result = await authService.login({
        email: 'passenger@example.com',
        password: 'correctPassword',
      });

      expect(result.accessToken).toBe('fake-access-token');
      expect(result.refreshToken).toBeTruthy();
      expect(Object.keys(result)).toEqual(['accessToken', 'refreshToken']);
    });

    it('rejects invalid password', async () => {
      await expect(
        authService.login({ email: 'passenger@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('rotates the token pair and revokes the old token', async () => {
      const loginResult = await authService.login({
        email: 'passenger@example.com',
        password: 'correctPassword',
      });

      const result = await authService.refresh(loginResult.refreshToken);

      expect(result.accessToken).toBe('fake-access-token');
      expect(result.refreshToken).not.toBe(loginResult.refreshToken);

      const oldToken = dbModule.__refreshTokens.find(
        (t: any) => t.id === 1,
      );
      expect(oldToken.revokedAt).toBeTruthy();
      expect(dbModule.__refreshTokens).toHaveLength(2);
    });

    it('rejects an already revoked token', async () => {
      const loginResult = await authService.login({
        email: 'passenger@example.com',
        password: 'correctPassword',
      });
      await authService.refresh(loginResult.refreshToken);

      await expect(authService.refresh(loginResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an unknown token', async () => {
      await expect(authService.refresh('totally-unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      const loginResult = await authService.login({
        email: 'passenger@example.com',
        password: 'correctPassword',
      });

      const result = await authService.logout(loginResult.refreshToken);

      expect(result.message).toBe('Logged out successfully');
      expect(dbModule.__refreshTokens[0].revokedAt).toBeTruthy();
    });

    it('is idempotent for unknown tokens', async () => {
      const result = await authService.logout('unknown-token');
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('getMe', () => {
    it('returns user profile with computed trustScore', async () => {
      const user = {
        id: 1,
        email: 'passenger@example.com',
        username: 'passenger',
        name: 'John Passenger',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: '2026-09-03T12:00:00.000Z',
      };

      const result = await authService.getMe(user);
      expect(result.id).toBe(1);
      expect(result.trustScore).toBe(0.75);
      expect((result as any).passwordHash).toBeUndefined();
    });
  });
});