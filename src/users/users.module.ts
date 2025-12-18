// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller'; // <-- Controller must be here
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { Role } from 'src/organizations/entities/role.entity';
import { RedisModule } from 'src/redis/redis.module';
import { JwtAuthGuard } from 'src/core/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/core/auth/permissions.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('ACCESS_TOKEN_SECRET') || '';
        const expiry =
          configService.get<string>('ACCESS_TOKEN_EXPIRY') || 3600000;

        return {
          secret,
          signOptions: { expiresIn: Number(expiry) },
        };
      },
    }),
    RedisModule,
    TypeOrmModule.forFeature([
      User,
      UserOrganization, // Required for tenancy checks in the service
      Role,
    ]),
  ],
  controllers: [UsersController], // <-- CRITICAL: Controller must be declared here
  providers: [UsersService, JwtAuthGuard, PermissionsGuard],
})
export class UsersModule {}
