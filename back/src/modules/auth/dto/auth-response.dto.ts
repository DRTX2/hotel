import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class AuthUserDto {
  @ApiProperty()
  @Expose()
  publicId: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ enum: UserRole })
  @Expose()
  role: UserRole;
}

export class AuthResponseDto {
  @ApiProperty()
  @Expose()
  accessToken: string;

  @ApiProperty()
  @Expose()
  refreshToken: string;

  @ApiProperty({ type: () => AuthUserDto })
  @Expose()
  user: AuthUserDto;
}
