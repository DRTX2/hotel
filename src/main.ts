import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false, //conversiones explicitas
        excludeExtraneousValues: true, //excluir propiedades no definidas en DTOs
      },
      whitelist: true,
      forbidNonWhitelisted: true, // error si se envían propiedades no definidas en DTOs
      forbidUnknownValues: true, // error si se envían valores no válidos (ej. string en lugar de number)
      validationError: {
        target: false, // no exponer objetos completos
        value: false, // no incluir el valor que falló en el error
      },
      exceptionFactory: (errors) => {
        // Logging estructurado para debugging
        console.error('Validation failed:', JSON.stringify(errors));

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        });
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
