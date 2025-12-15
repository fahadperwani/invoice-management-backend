import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // e.g., 'invoice:create', 'customer:view', 'organization:manage_users'
  @Column({ unique: true })
  name: string;

  @Column()
  description: string;
}
