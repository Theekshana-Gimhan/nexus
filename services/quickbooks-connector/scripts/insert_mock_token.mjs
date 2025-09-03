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
  await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  // Insert token
  const realmId = 'mock-realm-12345';
  const insertToken = `INSERT INTO qbo_tokens (realm_id, access_token, refresh_token, expires_in)
  VALUES ($1,$2,$3,$4) ON CONFLICT (realm_id) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_in = EXCLUDED.expires_in, updated_at = now()`;
  await client.query(insertToken, [realmId, 'mock-access-token', 'mock-refresh-token', 3600]);

  // Insert mapping
  const tenantId = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
  const insertMapping = `INSERT INTO qbo_tenant_mappings (realm_id, tenant_id, company_name)
  VALUES ($1,$2,$3) ON CONFLICT (realm_id) DO NOTHING`;
  await client.query(insertMapping, [realmId, tenantId, 'Mock Company LLC']);

  console.log('Inserted/updated mock token and mapping for realm:', realmId);
  await client.end();
})();
