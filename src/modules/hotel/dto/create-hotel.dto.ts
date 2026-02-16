import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;
}
