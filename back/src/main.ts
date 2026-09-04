import './config/load-env';
import 'reflect-metadata';
// sirve para metadata, decoradores, typeORM, class validator/transformer
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit, { Store } from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // inicia contenedor de dependencias y construye el grafo
  app.set('trust proxy', 1); // necesario para rate-limit correcto tras proxy/LB

  const logger = new Logger('Bootstrap'); // TODO: Pino/Winston con formato JSON + correlation-id

  // Seguridad
  app.use(helmet()); // headers de seguridad
  app.enableCors({
    origin: env.corsOrigins, // orígenes explícitos por env, nunca '*'
    credentials: true,
  });

  // Rate-limit: Redis en producción/compose, memoria solo como fallback local
  let store: Store | undefined;
  if (env.redisUrl) {
    try {
      const redis = new Redis(env.redisUrl, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
      });
      await redis.ping();
      store = new RedisStore({
        // rate-limit-redis v4 espera sendCommand estilo node-redis
        sendCommand: (...args: string[]): Promise<any> =>
          redis.call(args[0], ...args.slice(1)),
      });
      logger.log('Rate-limit store: redis');
    } catch (err) {
      logger.warn(
        `Redis no disponible, rate-limit en memoria: ${(err as Error).message}`,
      );
    }
  }
  app.use(
    rateLimit({
      windowMs: env.rateLimit.windowMs,
      max: env.rateLimit.max,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      ...(store ? { store } : {}),
      message:
        'Demasiadas peticiones desde esta IP, por favor intente más tarde',
    }),
  );

  // Config Swagger
  const config = new DocumentBuilder()
    .setTitle('Hotel API')
    .setDescription('API para gestión de hoteles')
    .setVersion('1.0')
    .addBearerAuth() // JWT (Sprint 2)
    .build();

  const document = SwaggerModule.createDocument(app, config); // escanea app
  SwaggerModule.setup('api', app, document);

  // Prefijo Global para versionado por URI
  app.setGlobalPrefix('v1');

  // Filtro Global de Excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptor Global de Logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validación global estricta
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina lo que no este
      forbidNonWhitelisted: true, // error si se envia lo que no debia
      transform: true, // conversion automatica de tipado
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(env.port);

  logger.log(`Application running on: http://localhost:${env.port}/v1`);
  logger.log(`Swagger docs at: http://localhost:${env.port}/api`);
}
void bootstrap();
