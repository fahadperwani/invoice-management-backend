import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource, // Inject DataSource for transactional control
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
      const newUser = queryRunner.manager.create(User, {
        name: dto.userName,
        email: dto.email,
        passwordHash: passwordHash, // Note the camelCase property mapping
        emailVerified: true,
      });
      await queryRunner.manager.save(newUser);

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
}
