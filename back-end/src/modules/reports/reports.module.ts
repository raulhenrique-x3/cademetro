import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { EventsModule } from '../events/events.module.js';
import { StatusModule } from '../../infra/http/status/status.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersService } from '../users/users.service.js';
import { ReliabilityService } from '../../infra/http/status/reliability.service.js';

@Module({
  imports: [EventsModule, StatusModule, AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, UsersService, ReliabilityService],
  exports: [ReportsService],
})
export class ReportsModule {}
