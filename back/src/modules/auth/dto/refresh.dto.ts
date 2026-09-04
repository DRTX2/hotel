import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token vigente' })
  @IsJWT()
  @IsNotEmpty()
  refreshToken: string;
}
