import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env') });

const client = new pg.Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'nexus',
  password: process.env.DB_PASSWORD || 'nexus_dev_password',
  database: process.env.DB_NAME || 'postgres'
});

(async () => {
  await client.connect();
  // Create database if not exists
  const dbName = process.env.DB_NAME || 'nexus_qbo_connector';
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
  if (res.rowCount === 0) {
    console.log('Creating database', dbName);
    await client.query(`CREATE DATABASE ${dbName}`);
  } else {
    console.log('Database exists:', dbName);
  }
  await client.end();

  // Connect to the new DB and run raw SQL to create uuid extension and tables
  const client2 = new pg.Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'nexus',
    password: process.env.DB_PASSWORD || 'nexus_dev_password',
    database: dbName
  });
  await client2.connect();

  // Ensure pgcrypto extension for gen_random_uuid
  await client2.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  const createTokens = `
    CREATE TABLE IF NOT EXISTS qbo_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      realm_id text NOT NULL,
      access_token text NOT NULL,
      refresh_token text NOT NULL,
      expires_in integer NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `;

  const createMappings = `
    CREATE TABLE IF NOT EXISTS qbo_tenant_mappings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      realm_id text NOT NULL UNIQUE,
      tenant_id uuid NOT NULL,
      company_name text,
      created_at timestamptz DEFAULT now()
    );
  `;

  await client2.query(createTokens);
  await client2.query(createMappings);

  console.log('DB initialized.');
  await client2.end();
  process.exit(0);
})();
