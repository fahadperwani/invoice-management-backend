import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from 'src/organizations/entities/role.entity';
import { JwtAuthGuard } from 'src/core/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/core/auth/permissions.guard';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission])],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    JwtAuthGuard,
    PermissionsGuard,
    JwtService,
    RedisService,
  ],
})
export class PermissionsModule {}
