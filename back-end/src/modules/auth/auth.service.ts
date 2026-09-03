import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
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
    if (!user) {
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

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}