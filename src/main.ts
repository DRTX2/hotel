import 'reflect-metadata';
// sirve para metadata, decoradores, typeORM, class validator/transformer
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // inicia contenedor de dependencias, crea la app express(se puede cambiar a fastify) y construye un grafo de dependencias.

  const logger = new Logger('Bootstrap'); // luego se puede cambiar a pino/winston/logger estructurado json

  // Seguridad
  app.use(helmet()); // helmet agrega headers de seguridad para prevenir ataques
  app.enableCors(); // de momento aceptara cualquier origen
  app.use( // finalmente un rate limiter, luego cambiarlo por redis store y api gateway
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // limita cada IP a 100 peticiones por ventana
      message:
        'Demasiadas peticiones desde esta IP, por favor intente después de 15 minutos',
    }),
  );

  // Config Swagger
  const config = new DocumentBuilder()
    .setTitle('Hotel API')
    .setDescription('API para gestión de hoteles')
    .setVersion('1.0')
    .addBearerAuth() // Si añades JWT después
    .build();

  const document = SwaggerModule.createDocument(app, config); // escanea app
  SwaggerModule.setup('api', app, document);

  // Prefijo Global, para versionado pro uri, se puede usar header versioning y versionado por controller.
  app.setGlobalPrefix('v1');

  // Filtro Global de Excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptor Global de Logging, no incluir logica
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validación global corregida
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina lo que no este
      forbidNonWhitelisted: true, // error si se envia lo que no debia
      transform: true, // conversion automatica de tipado
      transformOptions: {
        enableImplicitConversion: true, // permite conversion automaticas sin decoradores explicitos, util para que Swagger y JSON funcionen bien
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/v1`);
  logger.log(
    `📚 Swagger documentation available at: http://localhost:${port}/api`,
  );
}
bootstrap();
