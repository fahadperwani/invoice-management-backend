import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/organizations/entities/role.entity';
import { RolePermission } from 'src/permissions/entities/role-permission.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import {
  AuthTokenPayload,
  AuthTokens,
  AuthUser,
  LoginResponse,
  RegisterTenantResponse,
} from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerTenant(
    dto: RegisterTenantDto,
  ): Promise<RegisterTenantResponse> {
    const queryRunner = this.dataSource.createQueryRunner();

    // 1. Establish connection and begin transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Prepare Data
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Generate a URL-friendly slug for the organization
      const orgSlug = slugify(dto.organizationName, {
        lower: true,
        strict: true,
      });

      // 3. Create User (Instance of the entity)
      const newUser = await queryRunner.manager.save(User, {
        name: dto.userName,
        email: dto.email,
        passwordHash: passwordHash, // Note the camelCase property mapping
        emailVerified: true,
      });

      // 4. Create Organization (Tenant Instance)
      const newOrg = await queryRunner.manager.save(Organization, {
        name: dto.organizationName,
        slug: orgSlug,
      });

      const adminRole = await queryRunner.manager.save(Role, {
        organizationId: newOrg.id,
        name: 'Admin',
        isSystemRole: true,
      });

      const allPermissions = await queryRunner.manager.find(Permission);

      const rolePermissions = allPermissions.map((permission) =>
        queryRunner.manager.create(RolePermission, {
          roleId: adminRole.id,
          permissionId: permission.id,
        }),
      );
      await queryRunner.manager.save(rolePermissions);

      const membership = queryRunner.manager.create(UserOrganization, {
        userId: newUser.id,
        organizationId: newOrg.id,
        status: 'active',
      });
      await queryRunner.manager.save(membership);

      await queryRunner.commitTransaction();

      const user: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };
      return {
        user,
        organization: { id: newOrg.id, name: newOrg.name, slug: newOrg.slug },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);

      if (err instanceof Error) {
        // Check for unique constraint violation error code (PostgreSQL standard is '23505')
        if ('code' in err && err.code === '23505') {
          // This happens if email or organization slug already exists
          throw new ConflictException(
            'Email or organization name/slug already exists.',
          );
        }
      }

      throw new InternalServerErrorException(
        'Failed to register the organization and user.',
      );
    } finally {
      // 8. Always release the query runner
      await queryRunner.release();
    }
  }

  async validateUser(email: string, pass: string): Promise<User> {
    // 1. Fetch user by email (using queryRunner.manager or UserRepository)
    const user = await this.dataSource.manager.findOneBy(User, { email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // 2. Compare password hash
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Return the user object (excluding the hash)
    return user;
  }

  /**
   * Helper function to generate both Access and Refresh tokens.
   */
  private generateTokens(payload: AuthTokenPayload): AuthTokens {
    // 1. ACCESS TOKEN (Uses the JwtModule default config: JWT_ACCESS_SECRET)
    const accessToken = this.jwtService.sign(payload); // No extra options needed, uses module defaults

    // 2. REFRESH TOKEN (Overrides the default secret with JWT_REFRESH_SECRET)
    const refreshToken = this.jwtService.sign(
      { sub: payload.sub }, // Minimal payload: only the user ID (sub)
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'), // <-- CORRECTLY OVERRIDES SECRET
        expiresIn: '7d', // Longer expiration for refresh tokens
      },
    );

    // TODO: Hash and store the Refresh Token in the 'sessions' table here!

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(dto.email, dto.password);

    const memberships = await this.dataSource.manager.find(UserOrganization, {
      where: { userId: user.id, status: 'active' },
    });

    if (!memberships || memberships.length === 0) {
      throw new UnauthorizedException(
        'User is not an active member of any organization.',
      );
    }

    const primaryMembership = memberships[0];

    // 2. Fetch all permissions for this role
    const permissionsRecords = await this.dataSource.manager.find(
      RolePermission,
      {
        where: { roleId: primaryMembership.roleId },
        relations: ['permission'], // Assuming you have relations set up
      },
    );

    const permissions = permissionsRecords.map((rp) => rp.permission.name); // e.g., ['invoice:view', 'invoice:edit']

    // 2. Define the JWT Payload (The Identity & Scope)
    const payload: AuthTokenPayload = {
      sub: user.id, // Subject (User ID)
      email: user.email,
      orgId: primaryMembership.organizationId, // Tenant/Organization ID (CRITICAL for multi-tenancy)
      permissions: permissions, // User permissions within the tenant
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    // 3. Generate the token
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return { accessToken, refreshToken, user: authUser };
  }
}
