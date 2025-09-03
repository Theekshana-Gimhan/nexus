import express from 'express';
import { getKnex } from '../db';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { getServiceToken } from '../services/serviceAuth';
import { recordAudit } from '../repos/auditRepo';

const router = express.Router();

// protect all admin routes
router.use(authenticateToken);

// POST /api/admin/session - server-to-server session: connector exchanges its client credentials for a service token and sets cookie
router.post('/session', async (req, res) => {
  try {
    const identityBase = process.env.IDENTITY_BASE || 'http://identity-service:3001';
    const clientId = process.env.SERVICE_CLIENT_ID;
    const clientSecret = process.env.SERVICE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(500).json({ error: 'Connector not configured for service auth' });
    const token = await getServiceToken(identityBase, clientId, clientSecret);
  // set cookie (httpOnly, secure in prod)
  res.cookie('connector_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 });
  // audit log
  await recordAudit({ actorId: `service:${process.env.SERVICE_CLIENT_ID}`, action: 'session.created', payload: { service: process.env.SERVICE_CLIENT_ID } });
  res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to obtain session token' });
  }
});

router.get('/mappings', requirePermission('integrations:manage:connectors'), async (req, res) => {
  const knex = getKnex();
  const rows = await knex('qbo_tenant_mappings').select('*').orderBy('created_at', 'desc');
  res.json(rows);
});

router.get('/mappings/:realmId', requirePermission('integrations:manage:connectors'), async (req, res) => {
  const { realmId } = req.params;
  const knex = getKnex();
  const row = await knex('qbo_tenant_mappings').where({ realm_id: realmId }).first();
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/mappings', requirePermission('integrations:manage:connectors'), async (req, res) => {
  const { realmId, tenantId, companyName } = req.body;
  if (!realmId || !tenantId) return res.status(400).json({ error: 'realmId and tenantId required' });
  const knex = getKnex();
  const [row] = await knex('qbo_tenant_mappings').insert({ realm_id: realmId, tenant_id: tenantId, company_name: companyName }).returning('*');
  await recordAudit({ actorId: (req as any).user?.userId || 'unknown', action: 'mapping.created', payload: row });
  res.status(201).json(row);
});

router.delete('/mappings/:realmId', requirePermission('integrations:manage:connectors'), async (req, res) => {
  const { realmId } = req.params;
  const knex = getKnex();
  await knex('qbo_tenant_mappings').where({ realm_id: realmId }).del();
  await recordAudit({ actorId: (req as any).user?.userId || 'unknown', action: 'mapping.deleted', payload: { realmId } });
  res.status(204).end();
});

export default router;
