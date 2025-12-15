import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UserRolePermissions1765792843181 implements MigrationInterface {
  // Use a unique name for the migration
  name = 'UserRolePermissions1765792843181';
  public readonly timestamp = 1765792843181;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----------------------------------------------------------------------
    // 1. CREATE ROLES TABLE (Tenant-scoped custom roles)
    // ----------------------------------------------------------------------
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'organization_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'text', isNullable: false }, // e.g., "Auditor"
          { name: 'is_system_role', type: 'boolean', default: false }, // For 'Owner' or 'Admin'
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamp', default: 'NOW()' },
        ],
        uniques: [{ columnNames: ['organization_id', 'name'] }],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['organization_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'organizations',
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    // ----------------------------------------------------------------------
    // 2. CREATE PERMISSIONS TABLE (Global actions)
    // ----------------------------------------------------------------------
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'name', type: 'text', isUnique: true, isNullable: false }, // e.g., 'invoice:delete'
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'NOW()' },
        ],
      }),
    );

    // ----------------------------------------------------------------------
    // 3. CREATE ROLE_PERMISSIONS JUNCTION TABLE
    // ----------------------------------------------------------------------
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          { name: 'role_id', type: 'uuid', isNullable: false },
          { name: 'permission_id', type: 'uuid', isNullable: false },
        ],
        uniques: [{ columnNames: ['role_id', 'permission_id'] }],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['role_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'roles',
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['permission_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'permissions',
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    // ----------------------------------------------------------------------
    // 4. UPDATE USER_ORGANIZATIONS TABLE
    // ----------------------------------------------------------------------

    // A. Drop the old hardcoded 'role' column
    await queryRunner.dropColumn('user_organizations', 'role');

    // B. Add the new 'role_id' column
    await queryRunner.addColumn(
      'user_organizations',
      new TableColumn({
        name: 'role_id',
        type: 'uuid',
        isNullable: true, // Allow null temporarily or if an old record exists without a role
      }),
    );

    // C. Add the foreign key constraint
    await queryRunner.createForeignKey(
      'user_organizations',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'SET NULL', // Or 'RESTRICT' depending on desired behavior
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ----------------------------------------------------------------------
    // 1. REVERT USER_ORGANIZATIONS TABLE CHANGES
    // ----------------------------------------------------------------------
    // A. Remove the role_id foreign key
    const userOrgTable = await queryRunner.getTable('user_organizations');
    const fkRole = userOrgTable?.foreignKeys.find((fk) =>
      fk.columnNames.includes('role_id'),
    );
    if (fkRole) {
      await queryRunner.dropForeignKey('user_organizations', fkRole);
    }

    // B. Drop the role_id column
    await queryRunner.dropColumn('user_organizations', 'role_id');

    // C. Re-add the old hardcoded 'role' column (for full revert)
    await queryRunner.addColumn(
      'user_organizations',
      new TableColumn({
        name: 'role',
        type: 'text',
        isNullable: false,
        default: "'viewer'", // Important to set the default and NOT NULL constraints back
        // Note: You must manually re-add the CHECK constraint if needed
      }),
    );

    // ----------------------------------------------------------------------
    // 2. DROP NEW TABLES
    // ----------------------------------------------------------------------
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('permissions');
    await queryRunner.dropTable('roles');
  }
}
