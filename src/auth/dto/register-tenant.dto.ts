import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @IsEmail()
  @ApiProperty({
    example: 'admin@acme.com',
    description: 'The email address of the founding administrator.',
  })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({
    example: 'strongpassword123',
    description: 'The password for the founding administrator account.',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Alice Admin',
    description: 'The name of the founding administrator.',
  })
  userName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'The name of the organization (tenant) to be created.',
  })
  organizationName: string;
}
