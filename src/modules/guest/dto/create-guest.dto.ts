import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGuestDto {
  @ApiProperty({ description: 'Nombre completo del huésped', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'juan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+34 600000000' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Tipo de documento', example: 'DNI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentType: string;

  @ApiProperty({ description: 'Número de documento', example: '12345678A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentNumber: string;
}
