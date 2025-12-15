import {
  Entity,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('user_organizations')
@Unique(['userId', 'organizationId']) // Use property names, not column names
export class UserOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // IMPORTANT: Matches column names and is not decorated as a relation here
  @Column({ name: 'user_id' })
  userId: string;

  // IMPORTANT: Matches column names and is not decorated as a relation here
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({
    type: 'text',
    // The status options are defined by your SQL CHECK constraint
  })
  status: 'invited' | 'active' | 'disabled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  // ----------------------------------------------------------------------
  // NEW: Define the ManyToOne Relation to the Role entity
  // ----------------------------------------------------------------------
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' }) // Maps the 'role_id' column to the Role entity
  role: Role; // This property is what TypeORM loads when relations: ['role'] is used
}
