// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// --- Import the entities we just created ---
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';

@Module({
  imports: [
    // Register the entities so they are known to the ORM
    TypeOrmModule.forFeature([User, Organization, UserOrganization]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
