import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({
    description: 'Nombre del hotel',
    example: 'Hotel Central Madrid',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Ciudad donde se encuentra el hotel',
    example: 'Madrid',
  })
  @IsString()
  city: string;

  @ApiPropertyOptional({
    description: 'Descripción del hotel',
    example: 'Hotel de lujo en el centro de Madrid',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Calificación del hotel (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;
}
