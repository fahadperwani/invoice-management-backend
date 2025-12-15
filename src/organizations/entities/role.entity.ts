import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';
import { UserOrganization } from './user-organization.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  name: string;

  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean; // e.g., Owner, Admin

  // --- Relations ---
  @ManyToOne(() => Organization, (org) => org.roles)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Role -> RolePermission (One Role has many permission assignments)
  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  // Role -> UserOrganization (Many users can be assigned this role)
  @OneToMany(() => UserOrganization, (uo) => uo.role)
  userOrganizations: UserOrganization[];
}
