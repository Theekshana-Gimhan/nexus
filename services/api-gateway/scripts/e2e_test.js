const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

async function runE2E() {
  const outPath = path.join(__dirname, 'e2e_result.json');
  try {
    const token = jwt.sign(
      { userId: 'test-user-123', permissions: ['tenant:read','tenant:create','tenant:update','tenant:delete'] },
      'nexus_jwt_secret_key_2024',
      { expiresIn: '1h' }
    );

    const res = await axios.get('http://localhost:3000/api/v1/tenants', {
      headers: { Authorization: 'Bearer ' + token },
      timeout: 15000
    });

    const payload = {
      ok: true,
      status: res.status,
      data: res.data
    };

  try { fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8'); } catch (e) { console.error('Write error:', e.message); }
    return payload;
  } catch (err) {
    const payload = { ok: false };
    if (err.response) {
      payload.status = err.response.status;
      payload.data = err.response.data;
    } else {
      payload.error = err.message;
    }
  try { fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8'); } catch (e) { console.error('Write error:', e.message); }
    return payload;
  }
}

module.exports = { runE2E };
