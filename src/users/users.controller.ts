import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../core/auth/jwt-auth.guard'; // Basic Auth Guard
import { PermissionsGuard } from '../core/auth/permissions.guard'; // Permissions Guard
import { RequirePermissions } from '../core/auth/permissions.decorator'; // Custom decorator
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/core/types/core.types';

@UseGuards(JwtAuthGuard, PermissionsGuard) // Apply global Guards to the entire controller
@ApiBearerAuth('access-token') // Swagger Bearer Auth
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // The organization ID is extracted from the JWT payload (req.user)
  //

  /**
   * POST /users - Create/Invite User
   * Requires: user:create permission
   */
  @Post()
  // @RequirePermissions('user:create')
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ) {
    // Extract tenant ID from the authenticated user object
    const { orgId } = req.payload;
    return this.usersService.create(orgId, createUserDto);
  }

  /**
   * GET /users - List All Users in Organization
   * Requires: user:view permission
   */
  @Get()
  @RequirePermissions('user:view')
  findAll(@Req() req: AuthenticatedRequest) {
    const { orgId } = req.payload;
    return this.usersService.findAllByOrganization(orgId);
  }

  /**
   * GET /users/:id - View Single User
   * Requires: user:view permission
   */
  @Get(':id')
  @RequirePermissions('user:view')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { orgId } = req.payload;
    return this.usersService.findOneInOrganization(orgId, id);
  }

  /**
   * PUT /users/:id - Update User Details
   * Requires: user:edit permission
   */
  @Put(':id')
  @RequirePermissions('user:edit')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { orgId } = req.payload;
    return this.usersService.update(orgId, id, updateUserDto);
  }

  /**
   * DELETE /users/:id - Remove User (Disable Membership)
   * Requires: user:disable permission
   */
  @Delete(':id')
  @RequirePermissions('user:disable')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { orgId } = req.payload;
    return this.usersService.remove(orgId, id);
  }
}
