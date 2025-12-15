import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { AuthBase1733756400000 } from '../../migrations/1733756400000-AuthBase';
import { UserRolePermissions1765792843181 } from '../../migrations/1765792843181-UserRolePermissions';
import { SeedCorePermissions1765799222186 } from '../../migrations/1765799222186-SeedCorePermissions';

dotenv.config();

// ----------------------------------------------------------------------
// 1. NESTJS CONFIGURATION OBJECT (for App initialization)
// ----------------------------------------------------------------------
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  // Explicit ordering so base tables are created before dependent ones
  migrations: [
    AuthBase1733756400000,
    UserRolePermissions1765792843181,
    SeedCorePermissions1765799222186,
  ],
  synchronize: false,
};

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  // Keep migrations in the same explicit order for CLI runs
  migrations: [
    AuthBase1733756400000,
    UserRolePermissions1765792843181,
    SeedCorePermissions1765799222186,
  ],
  synchronize: false,
  logging: true,
});
