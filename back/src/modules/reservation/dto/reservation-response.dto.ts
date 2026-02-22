import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ReservationStatus } from '../entities/reservation.entity';
import { RoomResponseDto } from '../../room/dto/room-response.dto';

export class ReservationResponseDto {
  @ApiProperty({ description: 'ID público de la reserva' })
  @Expose()
  publicId: string;

  @ApiProperty({ description: 'Fecha de ingreso', example: '2024-05-01' })
  @Expose()
  checkIn: string;

  @ApiProperty({ description: 'Fecha de salida', example: '2024-05-05' })
  @Expose()
  checkOut: string;

  @ApiProperty({ description: 'Número de huéspedes', example: 2 })
  @Expose()
  numGuests: number;

  @ApiProperty({ enum: ReservationStatus })
  @Expose()
  status: ReservationStatus;

  @ApiProperty({ description: 'Precio total', example: 500 })
  @Expose()
  totalPrice: number;

  @ApiProperty({ type: () => RoomResponseDto })
  @Expose()
  @Type(() => RoomResponseDto)
  room: RoomResponseDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
