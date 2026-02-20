import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { RoomStatus, RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @ApiProperty({ description: 'ID público del hotel al que pertenece', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  hotelPublicId: string;

  @ApiProperty({ description: 'Número de habitación', example: '101A' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ description: 'Estado inicial', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  @IsEnum(RoomStatus)
  status: RoomStatus = RoomStatus.AVAILABLE;

  @ApiProperty({ description: 'Tipo de habitación', enum: RoomType })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty({ description: 'Precio base por noche', example: 120 })
  @IsInt()
  @Min(1)
  basePrice: number;
  
  updatedAt: Date;
}
