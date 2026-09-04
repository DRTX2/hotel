import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RoomType, RoomStatus } from '../entities/room.entity';

export class RoomResponseDto {
  @ApiProperty({
    description: 'ID público único de la habitación',
    example: 'd8e4f1a0-3b6c-4e8a-9f2d-7b1c0a2e3f4g',
  })
  @Expose()
  publicId: string;

  @ApiProperty({
    description: 'Número de habitación',
    example: '101A',
  })
  @Expose()
  number: string;

  @ApiProperty({
    description: 'Estado de la habitación',
    enum: RoomStatus,
  })
  @Expose()
  status: RoomStatus;

  @ApiProperty({
    description: 'Tipo de habitación',
    enum: RoomType,
  })
  @Expose()
  type: RoomType;

  @ApiProperty({
    description: 'Precio base por noche',
    example: 120,
  })
  @Expose()
  basePrice: number;

  @ApiProperty({
    description: 'Capacidad máxima de huéspedes',
    example: 2,
  })
  @Expose()
  capacity: number;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-05-01T10:00:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Última actualización',
    example: '2024-05-01T10:00:00Z',
  })
  @Expose()
  updatedAt: Date;
}
