import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCorePermissions1765799222186 implements MigrationInterface {
  name = 'SeedCorePermissions1765799222186';
  public readonly timestamp = 1765799222186;

  private permissions = [
    // --- ORGANIZATION MANAGEMENT ---
    {
      name: 'org:manage:users',
      description: 'Can invite, remove, and change roles of users.',
    },
    {
      name: 'org:manage:roles',
      description: 'Can create, edit, and delete custom roles and permissions.',
    },
    {
      name: 'org:view:settings',
      description: 'Can view general organization settings and profile.',
    },
    {
      name: 'org:update:settings',
      description: 'Can update general organization settings and profile.',
    },
    {
      name: 'org:view:billing',
      description: 'Can view billing information and subscription status.',
    },

    // --- USER MANAGEMENT (Specific Actions) ---
    // Note: 'org:manage:users' covers most, these offer finer control.
    { name: 'user:activate', description: 'Can activate a disabled user.' },
    { name: 'user:disable', description: 'Can disable (soft delete) a user.' },

    // --- CUSTOMER MANAGEMENT ---
    {
      name: 'customer:view',
      description: 'Can view all customer and client records.',
    },
    { name: 'customer:create', description: 'Can add new customer records.' },
    {
      name: 'customer:edit',
      description: 'Can modify existing customer details.',
    },
    {
      name: 'customer:delete',
      description: 'Can permanently delete customer records.',
    },

    // --- INVOICE MANAGEMENT ---
    {
      name: 'invoice:view:all',
      description: 'Can view all invoices across the organization.',
    },
    {
      name: 'invoice:view:self',
      description: 'Can only view invoices they created.',
    },
    { name: 'invoice:create', description: 'Can draft new invoices.' },
    {
      name: 'invoice:edit:draft',
      description: 'Can edit invoices in draft status.',
    },
    {
      name: 'invoice:finalize',
      description:
        'Can approve and send final invoices (move from draft to pending).',
    },
    {
      name: 'invoice:cancel',
      description: 'Can cancel or void a pending/sent invoice.',
    },
    {
      name: 'invoice:delete',
      description: 'Can permanently delete any invoice.',
    },

    // --- REPORTING / AUDIT ---
    {
      name: 'report:view:financial',
      description: 'Can access and view financial summary reports.',
    },
    {
      name: 'audit:view:logs',
      description: 'Can view the system audit logs for the organization.',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const valueStrings = this.permissions
      .map((p) => {
        // Escape quotes within the description if necessary
        const description = p.description.replace(/'/g, "''");
        // Use gen_random_uuid() to generate the ID in the database
        return `(gen_random_uuid(), '${p.name}', '${description}')`;
      })
      .join(',\n');

    await queryRunner.query(`
      INSERT INTO permissions (id, name, description)
      VALUES ${valueStrings}
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log('Successfully seeded core permissions.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert logic: Delete all permissions we just inserted.
    // We use a safe WHERE clause to delete only the known set of system permissions.
    const names = this.permissions.map((p) => `'${p.name}'`).join(', ');

    await queryRunner.query(`
      DELETE FROM permissions
      WHERE name IN (${names});
    `);

    console.log('Successfully deleted core permissions.');
  }
}
