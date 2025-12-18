import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Manager',
    description: 'The name of the role to be created.',
  })
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @ApiProperty({
    example: [
      'a1b2c3d4-e5f6-7g8h-9i10-jk11lm12no13',
      'p1q2r3s4-t5u6-v7w8-x9y10-za11bc12de13',
    ],
    description: 'An array of permission IDs to be associated with the role.',
  })
  permissionIds: string[];
}
