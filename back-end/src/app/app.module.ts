import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
// import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '../modules/auth/auth.module.js';
import { MetroModule } from '../modules/metro/metro.module.js';
import { ReportsModule } from '../modules/reports/reports.module.js';
import { StatusModule } from '../infra/http/status/status.module.js';
import { EventsModule } from '../modules/events/events.module.js';
import { UsersModule } from '../modules/users/users.module.js';
import { HttpExceptionFilter } from '../shared/errors/http-exception.filter.js';
import { JoiValidationPipe } from '../shared/pipes/joi-validation.pipe.js';
import { SanitizeUserInterceptor } from '../shared/interceptors/sanitize-user.interceptor.js';

// export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // ObserveModule.forRoot({
    //   appKey: 'YOUR_APP_KEY',
    //   appSecret: 'YOUR_APP_SECRET',
    //   serviceId: 'back-end',
    // }),
    AuthModule,
    MetroModule,
    ReportsModule,
    StatusModule,
    EventsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: JoiValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeUserInterceptor,
    },
  ],
})
export class AppModule {}