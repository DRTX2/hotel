import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationPipe,
  Logger
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('ValidationPipe');

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Hotel API')
    .setDescription('API para gestión de hoteles')
    .setVersion('1.0')
    .addTag('hotels', 'Operaciones relacionadas con hoteles')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
        excludeExtraneousValues: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors) => {
        // Logging estructurado SIN depender del request
        logger.error({
          event: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
          // Como no podemos acceder al request aquí, usamos un ID generado o null
          correlationId: 'N/A', // O se podría usar async_hooks para esto
          errors: errors.map((e) => ({
            field: e.property,
            attemptedValue: e.value,
            constraints: e.constraints,
            target: e.target?.constructor?.name,
          })),
        });

        // Respuesta al cliente (limpia y segura)
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          code: 'ERR_VALIDATION',
          timestamp: new Date().toISOString(),
          errors: errors.map((e) => ({
            field: e.property,
            messages: Object.values(e.constraints || []),
          })),
        });
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();