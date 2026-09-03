import { Module } from '@nestjs/common';
import { StatusController } from './status.controller.js';
import { StatusService } from './status.service.js';
import { ReliabilityService } from './reliability.service.js';

@Module({
  controllers: [StatusController],
  providers: [StatusService, ReliabilityService],
  exports: [StatusService, ReliabilityService],
})
export class StatusModule {}
