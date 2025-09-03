import { getKnex } from '../db';

export async function upsertToken(data: {
  realmId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  const knex = getKnex();
  const existing = await knex('qbo_tokens').where({ realm_id: data.realmId }).first();
  if (existing) {
    await knex('qbo_tokens').where({ realm_id: data.realmId }).update({
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expires_in: data.expiresIn,
      updated_at: knex.fn.now()
    });
    return knex('qbo_tokens').where({ realm_id: data.realmId }).first();
  }

  const [row] = await knex('qbo_tokens').insert({
    realm_id: data.realmId,
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
    expires_in: data.expiresIn
  }).returning('*');

  return row;
}

export async function getTokenByRealm(realmId: string) {
  const knex = getKnex();
  return knex('qbo_tokens').where({ realm_id: realmId }).first();
}
