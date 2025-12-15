// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller'; // <-- Controller must be here
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { Role } from 'src/organizations/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserOrganization, // Required for tenancy checks in the service
      Role,
    ]),
  ],
  controllers: [UsersController], // <-- CRITICAL: Controller must be declared here
  providers: [UsersService],
})
export class UsersModule {}
