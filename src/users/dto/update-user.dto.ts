import { PartialType } from '@nestjs/mapped-types'; // You may need to install this: npm install @nestjs/mapped-types
import { IsUUID, IsString, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

// Inherits all properties from CreateUserDto, but marks them as optional.
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // We can explicitly refine the roleId field if needed
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  // We explicitly exclude 'email' and 'password' from being easily updated via a simple PUT endpoint
  // A password update should have a separate, dedicated endpoint requiring the old password.

  // Example for a field specific to updates:
  @IsString()
  @IsOptional()
  status?: 'active' | 'disabled';
}
