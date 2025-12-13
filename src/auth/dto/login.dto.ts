import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'admin@acme.com',
    description: 'The email address of the founding administrator.',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({
    example: 'strongpassword123',
    description: 'The password for the founding administrator account.',
  })
  @ApiProperty({
    example: 'strongpassword123',
    description: 'The password for the founding administrator account.',
  })
  password: string;
}
