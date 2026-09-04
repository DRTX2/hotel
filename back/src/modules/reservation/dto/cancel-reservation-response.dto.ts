import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ReservationResponseDto } from './reservation-response.dto';

export class CancelReservationResponseDto {
  @ApiProperty({ type: () => ReservationResponseDto })
  @Expose()
  @Type(() => ReservationResponseDto)
  reservation: ReservationResponseDto;

  @ApiProperty({ description: 'Porcentaje de reembolso aplicado', example: 50 })
  @Expose()
  refundPercent: number;
}
