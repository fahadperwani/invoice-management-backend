import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('roles')
// Ensures a role name is unique only within a specific organization
@Unique(['name', 'organizationId'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  name: string; // e.g., "Senior Accountant"

  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean; // True for system-defined roles (Owner/Admin)
}
