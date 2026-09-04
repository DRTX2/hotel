import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'staff@hotel.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Secreta123' })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password debe incluir al menos una letra y un número',
  })
  password: string;

  @ApiProperty({
    enum: [UserRole.STAFF, UserRole.ADMIN],
    default: UserRole.STAFF,
  })
  @IsEnum([UserRole.STAFF, UserRole.ADMIN] as UserRole[])
  role: UserRole;
}
