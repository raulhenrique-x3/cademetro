import { Module } from '@nestjs/common';
import { MetroController } from './metro.controller.js';
import { MetroService } from './metro.service.js';

@Module({
  controllers: [MetroController],
  providers: [MetroService],
  exports: [MetroService],
})
export class MetroModule {}
