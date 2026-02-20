import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Número de página (empieza en 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;



  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  lastPage: number;
}

export class PaginatedResult<T> {
  data: T[];
  meta: PaginationMetaDto;
}
