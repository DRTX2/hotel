import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class HotelResponseDto {
  @ApiProperty({
    description: 'ID público único del hotel',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  publicId: string;

  @ApiProperty({
    description: 'Nombre del hotel',
    example: 'Hotel Central Madrid',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Ciudad donde se encuentra el hotel',
    example: 'Madrid',
  })
  @Expose()
  city: string;

  @ApiPropertyOptional({
    description: 'Descripción del hotel',
    example: 'Hotel de lujo en el centro de Madrid',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Calificación del hotel (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @Expose()
  rating: number;

  @ApiProperty({
    description: 'Fecha de creación del hotel',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del hotel',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Fecha de eliminación lógica del hotel (soft delete)',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  deletedAt?: Date;
}