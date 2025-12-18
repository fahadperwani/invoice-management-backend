import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from 'src/core/auth/permissions.guard';
import { JwtAuthGuard } from 'src/core/auth/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from 'src/core/auth/permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthenticatedRequest } from 'src/core/types/core.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}
  @Get()
  @RequirePermissions('org:manage:roles')
  @HttpCode(HttpStatus.OK)
  async getAllPermissions() {
    const result = await this.permissionsService.listPermissions();
    if (result instanceof Error) {
      throw new HttpException(
        result.message || 'Failed to list permissions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result;
  }

  @Get('roles')
  @RequirePermissions('org:manage:roles')
  @HttpCode(HttpStatus.OK)
  async getAllRoles(@Req() req: AuthenticatedRequest) {
    const { orgId } = req.payload;
    const result = await this.permissionsService.listRoles(orgId);
    if (result instanceof Error) {
      throw new HttpException(
        result.message || 'Failed to list roles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result;
  }

  @Post('roles')
  @RequirePermissions('org:manage:roles')
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRoleDto,
  ) {
    const { orgId } = req.payload;
    const result = await this.permissionsService.createRole(orgId, dto);
    if (result instanceof Error) {
      throw new HttpException(
        result.message || 'Failed to create role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result;
  }

  @Put('roles/:id')
  @RequirePermissions('org:manage:roles')
  async updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const { orgId } = req.payload;
    const result = await this.permissionsService.updateRole(orgId, roleId, dto);
    if (result instanceof Error) {
      throw new HttpException(
        result.message || 'Failed to update role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('roles/:id')
  @RequirePermissions('org:manage:roles')
  deleteRole(@Req() req: AuthenticatedRequest, @Param('id') roleId: string) {
    const { orgId } = req.payload;
    return this.permissionsService.deleteRole(orgId, roleId);
  }
}
