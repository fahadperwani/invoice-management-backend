// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// --- Import the entities we just created ---
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/core/auth/jwt.strategy';
import { RedisService } from 'src/redis/redis.service';
import { JwtAuthGuard } from 'src/core/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/core/auth/permissions.guard';

@Module({
  imports: [
    ConfigModule,
    // Register the entities so they are known to the ORM
    TypeOrmModule.forFeature([User, Organization, UserOrganization]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Use an async factory to load secrets safely from config
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('ACCESS_TOKEN_SECRET') || '';
        const expiry =
          configService.get<string>('ACCESS_TOKEN_EXPIRY') || 3600000;

        return {
          secret: secret,
          signOptions: { expiresIn: Number(expiry) },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RedisService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
