import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GuestResponseDto {
  @ApiProperty({ description: 'ID público del huésped', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  publicId: string;

  @ApiProperty({ description: 'Nombre completo del huésped', example: 'Juan Pérez' })
  @Expose()
  fullName: string;

  @ApiProperty({ description: 'Email del huésped', example: 'juan.perez@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono del huésped', example: '+1234567890' })
  @Expose()
  phone?: string;

  @ApiProperty({ description: 'Tipo de documento', example: 'DNI' })
  @Expose()
  documentType: string;

  @ApiProperty({ description: 'Número de documento', example: '12345678A' })
  @Expose()
  documentNumber: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  @Expose()
  updatedAt: Date;
}