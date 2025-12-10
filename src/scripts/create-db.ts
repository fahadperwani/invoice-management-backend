import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  console.log({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    database: 'postgres', // connect to default DB
  });
  const dbName = process.env.DB_NAME;
  const adminClient = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    database: 'postgres', // connect to default DB
  });

  await adminClient.connect();

  const res = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname='${dbName}'`,
  );
  if (res.rowCount === 0) {
    console.log(`Database '${dbName}' not found. Creating…`);
    await adminClient.query(`CREATE DATABASE "${dbName}";`);
  } else {
    console.log(`Database '${dbName}' already exists.`);
  }

  await adminClient.end();
}

createDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});
