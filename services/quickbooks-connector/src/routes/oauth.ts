import express from 'express';
import axios from 'axios';

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

  if (process.env.MOCK_MODE === 'true') {
    // Return mock token
    return res.json({ access_token: 'mock-qbo-token', refresh_token: 'mock-refresh', realmId: '12345' });
  }

  try {
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

    // Persist tokens to DB / store (omitted in scaffold)
    res.json(response.data);
  } catch (err) {
    console.error('OAuth exchange failed', err);
    res.status(500).json({ error: 'OAuth exchange failed' });
  }
});

export default router;
