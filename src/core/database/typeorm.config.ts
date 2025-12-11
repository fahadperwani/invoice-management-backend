import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

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

  // Entities: Path relative to your project root after compilation
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],

  // MIGRATIONS: CORRECTED PATH (Relative to src/core/database)
  migrations: [__dirname + '/../../migrations/*.js'],

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
  migrations: [__dirname + '/../../migrations/*.js'],
  synchronize: false,
  logging: true,
});
