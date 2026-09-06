import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// import { AppModule, ObserveInstrument } from './app/app.module.js';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule, {
  //   instrument: ObserveInstrument, // reativar quando configurar @nestjs/observe
  // });
  const app = await NestFactory.create(AppModule);

  // Trust proxy for reverse proxies (ngrok, Docker, Cloudflare)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security Headers
  app.use(helmet());

  // CORS
  const configuredOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin:
      configuredOrigin && configuredOrigin !== '*'
        ? configuredOrigin.split(',').map((o) => o.trim())
        : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            // Allow all origins with credentials support (reflects request origin)
            callback(null, true);
          },
    credentials: true,
  });

  // Rate Limiting
  // 1. Global default: 120 requests/minute
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many requests, please try again later.',
        timestamp: new Date().toISOString(),
      },
    }),
  );

  // 2. Login rate limit: 15 / minute (configurable via RATE_LIMIT_LOGIN_MAX)
  const loginRateLimit = Number(process.env.RATE_LIMIT_LOGIN_MAX) || 15;
  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 60 * 1000,
      limit: loginRateLimit,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many login attempts, please try again after a minute.',
        timestamp: new Date().toISOString(),
      },
    }),
  );

  // 3. Register rate limit: 10 / hour
  app.use(
    '/auth/register',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        error: 'Too Many Requests',
        message:
          'Too many account registrations, please try again after an hour.',
        timestamp: new Date().toISOString(),
      },
    }),
  );

  // 4. Report creation: 10 / minute; Confirmation/dispute: 30 / minute
  const reportCreationLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many reports created, please try again after a minute.',
      timestamp: new Date().toISOString(),
    },
  });

  const confirmationLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      error: 'Too Many Requests',
      message:
        'Too many confirmation actions, please try again after a minute.',
      timestamp: new Date().toISOString(),
    },
  });

  app.use('/reports', (req: any, res: any, next: any) => {
    if (req.method === 'POST' && (req.path === '' || req.path === '/')) {
      return reportCreationLimiter(req, res, next);
    }
    if (
      req.method === 'POST' &&
      (req.path.endsWith('/confirm') || req.path.endsWith('/dispute'))
    ) {
      return confirmationLimiter(req, res, next);
    }
    next();
  });

  // Swagger OpenAPI at /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CadêMetrô API')
    .setDescription(
      'REST API and realtime SSE for CadêMetrô - collaborative real-time Recife metro tracking',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 8006;
  await app.listen(port);
  console.log(
    `CadêMetrô API running on port ${port} (Swagger docs: http://localhost:${port}/docs)`,
  );
}

await bootstrap();
