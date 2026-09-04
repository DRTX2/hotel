import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/pagination/dto/pagination.dto';
import { RoomType } from '../entities/room.entity';

export class AvailabilityQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Fecha de ingreso',
    example: '2026-10-01',
  })
  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @ApiPropertyOptional({
    description: 'Fecha de salida',
    example: '2026-10-04',
  })
  @IsDateString()
  @IsNotEmpty()
  checkOut: string;

  @ApiPropertyOptional({ description: 'Huéspedes', example: 2, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number = 1;

  @ApiPropertyOptional({ description: 'Filtrar por ciudad', example: 'Madrid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo', enum: RoomType })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiPropertyOptional({ description: 'Filtrar por hotel (ID público)' })
  @IsOptional()
  @IsUUID()
  hotelPublicId?: string;
}
