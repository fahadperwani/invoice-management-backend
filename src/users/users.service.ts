import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity'; // User entity
import { UserOrganization } from '../organizations/entities/user-organization.entity'; // Membership entity
import { CreateUserDto } from './dto/create-user.dto'; // DTO for creating a user
import { UpdateUserDto } from './dto/update-user.dto'; // DTO for updating a user
import { hash } from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserOrganization) // Repository for multi-tenant context
    private userOrganizationsRepository: Repository<UserOrganization>,
  ) {}

  /**
   * CREATE: Invite a new user to the organization.
   * NOTE: In a real app, this should generate an invitation and not save the password immediately.
   */
  async create(orgId: string, createUserDto: CreateUserDto): Promise<User> {
    // 1. Check if the user already exists in the system by email
    let user = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (!user) {
      // 2. If user doesn't exist, create a new User record
      const passwordHash = await hash(createUserDto.password, 10);
      user = this.usersRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: passwordHash,
        emailVerified: false, // Must verify after invitation
      });
      await this.usersRepository.save(user);
    }

    const membership = this.userOrganizationsRepository.create({
      userId: user.id,
      organizationId: orgId,
      roleId: createUserDto.roleId, // Assign the role from the DTO/logic
      status: 'active',
    });
    await this.userOrganizationsRepository.save(membership);

    // NOTE: In a real scenario, you'd trigger an email invitation here.

    return user;
  }

  /**
   * READ: Find all active users belonging to a specific organization.
   */
  async findAllByOrganization(orgId: string): Promise<User[]> {
    // Join UserOrganization with User to filter members of the given organization
    const memberships = await this.userOrganizationsRepository.find({
      where: { organizationId: orgId, status: 'active' },
      relations: ['user', 'role'], // Load the User and Role details
    });

    // Extract the User entity from the memberships
    return memberships.map((m) => m.user);
  }

  /**
   * READ: Find a single user by ID within the scope of the organization.
   */
  async findOneInOrganization(orgId: string, userId: string): Promise<User> {
    // 1. Find the membership record to enforce tenancy
    const membership = await this.userOrganizationsRepository.findOne({
      where: { organizationId: orgId, userId: userId },
      relations: ['user'],
    });

    if (!membership) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this organization.`,
      );
    }

    // 2. Return the attached user entity
    return membership.user;
  }

  /**
   * UPDATE: Update user name/email/role (scoped to the organization).
   */
  async update(
    orgId: string,
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // Check if the user is a member of the organization (enforce tenancy)
    const membership = await this.userOrganizationsRepository.findOne({
      where: { organizationId: orgId, userId: userId },
    });

    if (!membership) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this organization.`,
      );
    }

    // Update only allowed fields on the User entity
    await this.usersRepository.update(userId, {
      name: updateUserDto.name,
      // email: updateUserDto.email, // Often restricted in updates
    });

    // You would update the role ID on the membership table if role is in DTO
    // if (updateUserDto.roleId) {
    //     await this.userOrganizationsRepository.update(membership.id, { roleId: updateUserDto.roleId });
    // }

    return this.findOneInOrganization(orgId, userId);
  }

  /**
   * DELETE: Remove user from organization (soft-delete/disable membership).
   */
  async remove(orgId: string, userId: string): Promise<void> {
    // Check if the user is the sole Admin/Owner before removal (safety check)
    // ...

    // We disable/deactivate the membership rather than deleting the User record.
    const result = await this.userOrganizationsRepository.update(
      { organizationId: orgId, userId: userId },
      { status: 'disabled' }, // Change membership status to disabled
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this organization.`,
      );
    }
  }
}
