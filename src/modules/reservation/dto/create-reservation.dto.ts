import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID público de la habitación', example: 'd8e4f1a0...' })
  @IsUUID()
  @IsNotEmpty()
  roomPublicId: string;

  @ApiProperty({ description: 'ID público del huésped', example: 'd8e4f1a0...' })
  @IsUUID()
  @IsNotEmpty()
  guestPublicId: string;

  @ApiProperty({ description: 'Fecha de ingreso', example: '2024-05-01' })
  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @ApiProperty({ description: 'Fecha de salida', example: '2024-05-05' })
  @IsDateString()
  @IsNotEmpty()
  checkOut: string;

  @ApiProperty({ description: 'Número de huéspedes', example: 2 })
  @IsInt()
  @Min(1)
  numGuests: number;
}
