import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthBase1733756400000 implements MigrationInterface {
  name = 'AuthBase1733756400000';
  public readonly timestamp = 1733756400000;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    await queryRunner.query(`
      CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE user_organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('admin','manager','staff','viewer')),
          status TEXT NOT NULL CHECK (status IN ('invited','active','disabled')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (user_id, organization_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          invited_by UUID REFERENCES users(id),
          role TEXT NOT NULL CHECK (role IN ('admin','manager','staff','viewer')),
          token TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          accepted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          refresh_token_hash TEXT NOT NULL,
          user_agent TEXT,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id),
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id UUID NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE audit_logs`);
    await queryRunner.query(`DROP TABLE api_keys`);
    await queryRunner.query(`DROP TABLE subscriptions`);
    await queryRunner.query(`DROP TABLE sessions`);
    await queryRunner.query(`DROP TABLE invitations`);
    await queryRunner.query(`DROP TABLE user_organizations`);
    await queryRunner.query(`DROP TABLE organizations`);
    await queryRunner.query(`DROP TABLE users`);
  }
}
