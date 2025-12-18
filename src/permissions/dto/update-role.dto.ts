import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

// All fields optional, but if provided they must meet the base constraints.
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
