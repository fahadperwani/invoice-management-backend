import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { Role } from 'src/organizations/entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    private readonly dataSource: DataSource,
  ) {}

  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({ order: { name: 'ASC' } });
  }

  async listRoles(organizationId: string): Promise<Role[]> {
    return this.roleRepo.find({
      where: { organizationId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { name: 'ASC' },
    });
  }

  async createRole(organizationId: string, dto: CreateRoleDto): Promise<Role> {
    const permissions = await this.permissionRepo.findBy({
      id: In(dto.permissionIds),
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException(
        'One or more permissions are invalid or not predefined.',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const role = manager.create(Role, {
          organizationId,
          name: dto.name,
          isSystemRole: false,
        });
        const savedRole = await manager.save(role);

        const rolePerms = permissions.map((permission) =>
          manager.create(RolePermission, {
            roleId: savedRole.id,
            permissionId: permission.id,
          }),
        );
        await manager.save(rolePerms);

        return savedRole;
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === '23505') {
          throw new ConflictException(
            'Role with this name already exists in the organization.',
          );
        }
      }
      throw error;
    }
  }

  async updateRole(
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found for this organization.');
    }

    if (role.isSystemRole) {
      throw new BadRequestException('System roles cannot be edited.');
    }

    const permissionIds = dto.permissionIds;
    let permissions: Permission[] = [];

    if (permissionIds && permissionIds.length > 0) {
      permissions = await this.permissionRepo.findBy({
        id: In(permissionIds),
      });

      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(
          'One or more permissions are invalid or not predefined.',
        );
      }
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        if (dto.name) {
          role.name = dto.name;
        }
        const savedRole = await manager.save(role);

        if (permissionIds) {
          await manager.delete(RolePermission, { roleId: role.id });
          const rolePerms = permissions.map((permission) =>
            manager.create(RolePermission, {
              roleId: role.id,
              permissionId: permission.id,
            }),
          );
          if (rolePerms.length > 0) {
            await manager.save(rolePerms);
          }
        }

        return savedRole;
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === '23505') {
          throw new ConflictException(
            'Role with this name already exists in the organization.',
          );
        }
      }
      throw error;
    }
  }

  async deleteRole(organizationId: string, roleId: string): Promise<void> {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found for this organization.');
    }

    if (role.isSystemRole) {
      throw new BadRequestException('System roles cannot be deleted.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RolePermission, { roleId: role.id });
      await manager.delete(Role, { id: role.id });
    });
  }
}
