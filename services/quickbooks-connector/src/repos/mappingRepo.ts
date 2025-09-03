import { getKnex } from '../db';

export async function createMapping(data: {
  realmId: string;
  tenantId: string;
  companyName?: string;
}) {
  const knex = getKnex();
  const [row] = await knex('qbo_tenant_mappings').insert({
    realm_id: data.realmId,
    tenant_id: data.tenantId,
    company_name: data.companyName
  }).returning('*');

  return row;
}

export async function findMappingByRealm(realmId: string) {
  const knex = getKnex();
  return knex('qbo_tenant_mappings').where({ realm_id: realmId }).first();
}
