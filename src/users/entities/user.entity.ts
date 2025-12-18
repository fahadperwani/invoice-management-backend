import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserOrganization } from '../../organizations/entities/user-organization.entity';
import { Permission } from 'src/permissions/entities/permission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  // --- Relations ---
  // A user can belong to many organizations (via UserOrganization/Membership)
  @OneToMany(() => UserOrganization, (membership) => membership.user)
  memberships: UserOrganization[];
}
