import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('Bootstrap');

  // 🛡️ Seguridad
  app.use(helmet());
  app.enableCors(); // Configura esto adecuadamente para prod
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // limita cada IP a 100 peticiones por ventana
      message:
        'Demasiadas peticiones desde esta IP, por favor intente después de 15 minutos',
    }),
  );

  // 📝 Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Hotel API')
    .setDescription('API para gestión de hoteles')
    .setVersion('1.0')
    .addBearerAuth() // Si añades JWT después
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 🌐 Prefijo Global
  app.setGlobalPrefix('v1');

  // 🚦 Filtro Global de Excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // 📡 Interceptor Global de Logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ✅ Validación global corregida
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Crucial para que Swagger y JSON funcionen bien
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
