import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import { db } from '../../infra/database/prisma/db.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenResponseDto, RegisterResponseDto, UserDto } from './dto/user.dto.js';
import { UsersService } from '../users/users.service.js';

const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN ??
  '2h') as JwtSignOptions['expiresIn'];
const REFRESH_TTL_MS = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN ?? '30d');

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const OAUTH_REDIRECT_URL =
  process.env.OAUTH_REDIRECT_URL ?? 'cademetro://auth/callback';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string | null;
}

function parseDuration(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d|w)$/i.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration value: ${value}`);
  }
  const amount = Number.parseInt(match[1], 10);
  const unitMs: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return amount * unitMs[match[2].toLowerCase()];
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const email = dto.email.trim().toLowerCase();

    const existing = await db.orm.public.User.where({ email }).first();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await db.orm.public.User.create({
      email,
      passwordHash,
      username: dto.username?.trim() || null,
      name: dto.name?.trim() || null,
      role: 'USER',
      status: 'ACTIVE',
    });

    return {
      id: user.id,
      message: 'Account created successfully',
    };
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const email = dto.email.trim().toLowerCase();

    const user = await db.orm.public.User.where({ email }).first();
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is suspended');
    }

    return this.issueTokens(user.id, user.role, user.status);
  }

  async refresh(rawToken: string): Promise<TokenResponseDto> {
    const tokenHash = this.hashToken(rawToken);

    const stored = await db.orm.public.RefreshToken.where({ tokenHash }).first();
    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date(stored.expiresAt).getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await db.orm.public.User.where({ id: stored.userId }).first();
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is suspended');
    }

    await this.revokeToken(stored.id);

    return this.issueTokens(user.id, user.role, user.status);
  }

  async logout(rawToken: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(rawToken);

    const stored = await db.orm.public.RefreshToken.where({ tokenHash }).first();
    if (stored && !stored.revokedAt) {
      await this.revokeToken(stored.id);
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(currentUser: any): Promise<UserDto> {
    const trustScore = await this.usersService.getUserTrustScore(currentUser.id);
    return {
      id: currentUser.id,
      email: currentUser.email,
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
      status: currentUser.status,
      trustScore,
      createdAt: currentUser.createdAt,
    };
  }

  buildGoogleAuthUrl(state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId || !redirectUri) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      state,
    });

    return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
  }

  get oauthRedirectUrl(): string {
    return OAUTH_REDIRECT_URL;
  }

  buildOauthErrorUrl(message: string, baseRedirectUrl?: string): string {
    const base = baseRedirectUrl || OAUTH_REDIRECT_URL;
    const params = new URLSearchParams({ error: message });
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}${params.toString()}`;
  }

  async signInWithGoogle(code: string): Promise<TokenResponseDto> {
    const { accessToken } = await this.exchangeGoogleCode(code);
    const profile = await this.fetchGoogleProfile(accessToken);

    const user = await this.upsertGoogleUser(profile);
    if (!user) {
      throw new InternalServerErrorException('Failed to upsert Google user');
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is suspended');
    }

    return this.issueTokens(user.id, user.role, user.status);
  }

  private async exchangeGoogleCode(code: string): Promise<{ accessToken: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new BadGatewayException('Failed to exchange OAuth code with Google');
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new BadGatewayException('Google did not return an access token');
    }

    return { accessToken: data.access_token };
  }

  private async fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
    const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BadGatewayException('Failed to fetch Google profile');
    }

    const data = (await response.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string | null;
    };

    if (!data.sub || !data.email) {
      throw new UnauthorizedException('Invalid Google profile');
    }
    if (data.email_verified === false) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      googleId: String(data.sub),
      email: data.email.toLowerCase(),
      name: data.name ?? null,
    };
  }

  private async upsertGoogleUser(profile: GoogleProfile) {
    const existing = await db.orm.public.User.where({
      googleId: profile.googleId,
    }).first();

    if (existing) {
      if (existing.email !== profile.email) {
        await db.orm.public.User.where({ id: existing.id }).update({
          email: profile.email,
        });
      }
      if (!existing.name && profile.name) {
        await db.orm.public.User.where({ id: existing.id }).update({
          name: profile.name,
        });
      }
      return db.orm.public.User.where({ id: existing.id }).first()!;
    }

    const byEmail = await db.orm.public.User.where({
      email: profile.email,
    }).first();

    if (byEmail) {
      if (byEmail.googleId) {
        throw new ConflictException(
          'Email is already linked to another Google account',
        );
      }
      await db.orm.public.User.where({ id: byEmail.id }).update({
        googleId: profile.googleId,
        name: byEmail.name ?? profile.name,
      });
      return db.orm.public.User.where({ id: byEmail.id }).first()!;
    }

    return db.orm.public.User.create({
      email: profile.email,
      googleId: profile.googleId,
      passwordHash: null,
      username: profile.email.split('@')[0],
      name: profile.name,
      role: 'USER',
      status: 'ACTIVE',
    });
  }

  private async issueTokens(
    userId: number,
    role: string,
    status: string,
  ): Promise<TokenResponseDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role, status },
      { expiresIn: ACCESS_EXPIRES_IN },
    );

    const refreshToken = await this.createRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: number): Promise<string> {
    const rawToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString();

    await db.orm.public.RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  private async revokeToken(id: number): Promise<void> {
    await db.orm.public.RefreshToken.where({ id }).update({
      revokedAt: new Date().toISOString(),
    });
  }

  async deleteAccount(userId: number): Promise<{ message: string }> {
    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 1. Delete refresh tokens
    await db.orm.public.RefreshToken.where({ userId }).delete();

    // 2. Delete confirmations made by this user
    await db.orm.public.ReportConfirmation.where({ userId }).delete();

    // 3. Delete confirmations on reports authored by this user
    const reports = await db.orm.public.Report.where({ authorId: userId }).all();
    for (const report of reports) {
      await db.orm.public.ReportConfirmation.where({ reportId: report.id }).delete();
    }

    // 4. Delete reports authored by this user
    await db.orm.public.Report.where({ authorId: userId }).delete();

    // 5. Delete the user
    await db.orm.public.User.where({ id: userId }).delete();

    return { message: 'Conta excluída com sucesso' };
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}