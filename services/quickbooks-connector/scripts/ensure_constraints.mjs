import pg from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') });

const client = new pg.Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'nexus',
  password: process.env.DB_PASSWORD || 'nexus_dev_password',
  database: process.env.DB_NAME || 'nexus_qbo_connector'
});

(async () => {
  await client.connect();
  try {
    await client.query(`ALTER TABLE qbo_tokens ADD CONSTRAINT qbo_tokens_realm_id_unique UNIQUE (realm_id);`);
    console.log('Added unique constraint on qbo_tokens.realm_id');
  } catch (e) {
    console.log('Constraint already exists or error:', e.message || e);
  }
  await client.end();
})();
