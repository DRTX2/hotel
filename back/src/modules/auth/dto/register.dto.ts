import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Mínimo 8 caracteres, con letra y número',
    example: 'Secreta123',
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72) // límite de bcrypt
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password debe incluir al menos una letra y un número',
  })
  password: string;
}
