import { getKnex } from '../db';

async function main() {
  const knex = getKnex();
  try {
    const tokens = await knex('qbo_tokens').select('*').limit(10);
    const mappings = await knex('qbo_tenant_mappings').select('*').limit(10);

    console.log('qbo_tokens:', tokens);
    console.log('qbo_tenant_mappings:', mappings);
  } catch (err) {
    console.error('DB read failed:', err);
  } finally {
    await knex.destroy();
  }
}

main();
