import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh.dto.js';
import { TokenResponseDto, RegisterResponseDto, UserDto } from './dto/user.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created', type: RegisterResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account suspended' })
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 403, description: 'Account suspended' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the given refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile and trust score' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: any): Promise<UserDto> {
    return this.authService.getMe(user);
  }

  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth sign-in (redirects to Google)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google authorization' })
  @ApiResponse({ status: 503, description: 'Google sign-in not configured' })
  google(@Res() res: Response): void {
    const state = randomBytes(24).toString('hex');

    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 10 * 60 * 1000,
      path: '/auth/google',
    });

    res.redirect(this.authService.buildGoogleAuthUrl(state));
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback - exchanges code and redirects with tokens' })
  @ApiResponse({ status: 302, description: 'Redirects to app with accessToken/refreshToken' })
  @ApiResponse({ status: 302, description: 'Redirects to app with error param on failure' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    res.clearCookie('google_oauth_state', { path: '/auth/google' });

    const expectedState = parseCookie(req.headers.cookie, 'google_oauth_state');
    if (!code || !state || !expectedState || !safeStateEqual(state, expectedState)) {
      res.redirect(this.authService.buildOauthErrorUrl('invalid_state'));
      return;
    }

    try {
      const tokens = await this.authService.signInWithGoogle(code);
      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      res.redirect(`${this.authService.oauthRedirectUrl}?${params.toString()}`);
    } catch {
      res.redirect(this.authService.buildOauthErrorUrl('access_denied'));
    }
  }
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return rest.join('=');
    }
  }
  return null;
}

function safeStateEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}