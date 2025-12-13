import {
  Entity,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
    // The role options are defined by your SQL CHECK constraint
  })
  role: 'admin' | 'manager' | 'staff' | 'viewer';

  @Column({
    type: 'text',
    // The status options are defined by your SQL CHECK constraint
  })
  status: 'invited' | 'active' | 'disabled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
