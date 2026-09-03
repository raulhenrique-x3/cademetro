import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { ReliabilityService } from '../../infra/http/status/reliability.service.js';

@Module({
  providers: [UsersService, ReliabilityService],
  exports: [UsersService],
})
export class UsersModule {}
