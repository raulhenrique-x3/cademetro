import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UsersService } from '../users/users.service.js';
import { ReliabilityService } from '../../infra/http/status/reliability.service.js';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-cademetro-2026',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
          '2h') as JwtSignOptions['expiresIn'],
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, UsersService, ReliabilityService],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
