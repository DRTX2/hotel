import { IsDate, IsEnum, isEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RoomStatus, RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @IsString()
  number: string;

  @IsEnum(RoomStatus, { message: `status must be one of: ${Object.values(RoomStatus).join(', ')}` })
  status: RoomStatus;

  @IsEnum(RoomType, { message: `type must be one of: ${Object.values(RoomType).join(', ')}` })
  type: RoomType;

  isPrivate: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsNumber()
  @Min(1)
  ownerId: number;

  @IsNumber()
  @Min(1)
  basePrice: number;

  @IsDate()
  createdAt: Date;

  updatedAt: Date;
}
