import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';
import { Role } from './role.entity';

@Entity('user_organizations')
export class UserOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'role_id' }) // <-- The Foreign Key to the Role entity
  roleId: string;

  @Column({ default: 'active' }) // e.g., 'active', 'disabled', 'invited'
  status: string;

  // --- Relations ---
  @ManyToOne(() => User, (user) => user.memberships)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.memberships)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => Role, (role) => role.userOrganizations) // Assuming inverse is set in Role
  @JoinColumn({ name: 'role_id' })
  role: Role; // <-- This lets us fetch the Role details
}
