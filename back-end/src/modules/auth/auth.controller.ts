import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh.dto.js';
import { TokenResponseDto, RegisterResponseDto, UserDto } from './dto/user.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import {
  createOauthState,
  isValidRedirectUrl,
  mapGoogleSignInError,
  parseOauthState,
  sanitizeOauthError,
} from './oauth-state.js';

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

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account and personal data' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: any): Promise<{ message: string }> {
    return this.authService.deleteAccount(user.id);
  }

  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth sign-in (redirects to Google)' })
  @ApiResponse({ status: 302, description: 'Redirects to Google authorization' })
  @ApiResponse({ status: 503, description: 'Google sign-in not configured' })
  google(
    @Res() res: Response,
    @Query('returnUrl') returnUrl?: string,
  ): void {
    const safeReturnUrl =
      returnUrl && isValidRedirectUrl(returnUrl) ? returnUrl : undefined;
    const state = createOauthState(safeReturnUrl);
    res.redirect(this.authService.buildGoogleAuthUrl(state));
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback - exchanges code and redirects with tokens' })
  @ApiResponse({ status: 302, description: 'Redirects to app with accessToken/refreshToken' })
  @ApiResponse({ status: 302, description: 'Redirects to app with error param on failure' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') googleError: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const payload = state ? parseOauthState(state) : null;
    const returnUrl =
      payload?.r && isValidRedirectUrl(payload.r) ? payload.r : null;
    const targetUrl = returnUrl ?? this.authService.oauthRedirectUrl;

    if (googleError) {
      res.redirect(
        this.authService.buildOauthErrorUrl(sanitizeOauthError(googleError), targetUrl),
      );
      return;
    }

    if (!code || !payload) {
      res.redirect(this.authService.buildOauthErrorUrl('invalid_state', targetUrl));
      return;
    }

    try {
      const tokens = await this.authService.signInWithGoogle(code);
      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      const separator = targetUrl.includes('?') ? '&' : '?';
      res.redirect(`${targetUrl}${separator}${params.toString()}`);
    } catch (err) {
      res.redirect(
        this.authService.buildOauthErrorUrl(mapGoogleSignInError(err), targetUrl),
      );
    }
  }
}