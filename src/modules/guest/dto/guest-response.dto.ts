import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GuestResponseDto {
  @ApiProperty({ description: 'ID público del huésped', example: '550e8400-e29b-41d4-a716-446655440000' })
  publicId: string;

  @ApiProperty({ description: 'Nombre completo del huésped', example: 'Juan Pérez' })
  fullName: string;

  @ApiProperty({ description: 'Email del huésped', example: 'juan.perez@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono del huésped', example: '+1234567890' })
  phone?: string;
  
}