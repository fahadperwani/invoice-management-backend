import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user.',
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'admin@acme.com',
    description: 'The email address of the user.',
  })
  email: string;

  // IMPORTANT: In a real app, the password is only temporary for inviting
  // or may be omitted entirely, with the user setting it via an invite link.
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @ApiProperty({
    example: 'strongpassword123',
    description: 'The password for the user account.',
  })
  password: string;

  // Role ID is required to assign the new user a starting role within the organization
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({
    example: 'TODO: FETCH DEFAULT ROLE ID FOR ORG',
    description: 'The ID of the default role for the organization.',
  })
  roleId: string;
}
