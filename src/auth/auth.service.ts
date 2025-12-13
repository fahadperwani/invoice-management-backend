import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RegisterTenantDto } from './dto/register-tenant.dto';

// --- IMPORT YOUR ENTITIES ---
// Ensure these paths match your file structure:
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';

import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource, // Inject DataSource for transactional control
    private readonly jwtService: JwtService, // Inject JwtService for token generation
  ) {}

  async registerTenant(dto: RegisterTenantDto): Promise<any> {
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
      const newOrg = queryRunner.manager.create(Organization, {
        name: dto.organizationName,
        slug: orgSlug,
      });
      await queryRunner.manager.save(newOrg);

      // 5. Create User-Organization Link (Assigning Admin Role)
      const membership = queryRunner.manager.create(UserOrganization, {
        userId: newUser.id,
        organizationId: newOrg.id,
        role: 'admin', // Founding user is automatically the admin
        status: 'active',
      });
      await queryRunner.manager.save(membership);

      // 6. Commit Transaction (All operations were successful)
      await queryRunner.commitTransaction();

      // Return details needed for the response (without the password hash)
      return {
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        organization: { id: newOrg.id, name: newOrg.name, slug: newOrg.slug },
      };
    } catch (err) {
      // 7. Rollback on Error (If any step failed, undo everything)
      await queryRunner.rollbackTransaction();

      // Use a type guard to safely check for specific database errors
      if (err instanceof Error) {
        // Check for unique constraint violation error code (PostgreSQL standard is '23505')
        if ('code' in err && err.code === '23505') {
          // This happens if email or organization slug already exists
          throw new ConflictException(
            'Email or organization name/slug already exists.',
          );
        }
      }

      console.error('Tenant Registration Failed:', err);
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

  async login(dto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.validateUser(dto.email, dto.password);

    // 1. Fetch ALL roles and organizations for the user
    // This is critical for determining the JWT payload scope
    const memberships = await this.dataSource.manager.find(UserOrganization, {
      where: { userId: user.id, status: 'active' },
    });

    if (!memberships || memberships.length === 0) {
      throw new UnauthorizedException(
        'User is not an active member of any organization.',
      );
    }

    // For simplicity, we'll use the *first* organization ID and role as the primary context
    // In a production app, the user might select the active organization ID after login.
    const primaryMembership = memberships[0];

    // 2. Define the JWT Payload (The Identity & Scope)
    const payload = {
      sub: user.id, // Subject (User ID)
      email: user.email,
      orgId: primaryMembership.organizationId, // Tenant/Organization ID (CRITICAL for multi-tenancy)
      role: primaryMembership.role, // User's role within that tenant
    };

    // 3. Generate the token
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
