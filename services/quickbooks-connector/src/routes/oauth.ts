import express from 'express';
import axios from 'axios';
import { upsertToken } from '../repos/tokenRepo';
import { createMapping, findMappingByRealm } from '../repos/mappingRepo';

const router = express.Router();

// Redirect user to QuickBooks OAuth consent page
router.get('/start', (req, res) => {
  const clientId = process.env.QBO_CLIENT_ID;
  const redirectUri = process.env.QBO_REDIRECT_URI;
  const scope = encodeURIComponent('com.intuit.quickbooks.accounting');
  const state = encodeURIComponent('nexus_connector_state');

  const url = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
  res.redirect(url);
});

// OAuth callback to exchange code for tokens
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    if (process.env.MOCK_MODE === 'true') {
      const mock = { access_token: 'mock-qbo-token', refresh_token: 'mock-refresh', realmId: '12345', expires_in: 3600 };
      // Persist mock token
      await upsertToken({ realmId: mock.realmId, accessToken: mock.access_token, refreshToken: mock.refresh_token, expiresIn: mock.expires_in });
      // Create mapping if missing (tenant id must be supplied via query or manual mapping UI)
      const tenantId = String(req.query.tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000');
      const existing = await findMappingByRealm(mock.realmId);
      if (!existing) await createMapping({ realmId: mock.realmId, tenantId, companyName: 'Mock Company' });
      return res.json(mock);
    }

    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    const auth = Buffer.from(`${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', String(code));
    params.append('redirect_uri', String(process.env.QBO_REDIRECT_URI));

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = response.data;
    // Persist tokens
    await upsertToken({ realmId: data.realmId || data.realmId || data.realmId || 'unknown', accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: parseInt(data.expires_in || '3600') });

    // Optionally create mapping (tenantId must be provided by installer via query or UI)
    const tenantId = String(req.query.tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000');
    const existing = await findMappingByRealm(data.realmId);
    if (!existing) await createMapping({ realmId: data.realmId, tenantId, companyName: data.realName || '' });

    res.json(data);
  } catch (err: any) {
    console.error('OAuth exchange failed', err?.message || err);
    res.status(500).json({ error: 'OAuth exchange failed' });
  }
});

export default router;
