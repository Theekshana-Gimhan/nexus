import { getKnex } from '../db';

export async function recordAudit(entry: { actorId: string; actorType?: string; action: string; payload?: any; }){
  const knex = getKnex();
  await knex('audit_logs').insert({ actor_id: entry.actorId, actor_type: entry.actorType || 'service', action: entry.action, payload: JSON.stringify(entry.payload || {}) });
}
