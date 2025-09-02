const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const OUT = path.resolve(__dirname, 'e2e_result.json');
const VALIDATOR = path.resolve(__dirname, 'validate_e2e.js');
const URLS = [
  'http://127.0.0.1:3000/internal/debug/proxy-tenants',
  'http://localhost:3000/internal/debug/proxy-tenants'
];

(async () => {
  try {
    console.log('Attempting debug endpoints:', URLS);
    let res = null;
    for (const u of URLS) {
      try {
        res = await axios.get(u, { timeout: 10000 });
        console.log('Success with', u);
        break;
      } catch (err) {
        console.warn('Endpoint failed:', u, err.message);
      }
    }
    if (!res) throw new Error('All endpoints failed');
    let data = res.data;

    // If response was returned as a string with markdown fences, clean it
    if (typeof data === 'string') {
      let s = data.replace(/\uFEFF/, '');
      const lines = s.split(/\r?\n/);
      if (lines.length && lines[0].trim().startsWith('```')) lines.shift();
      if (lines.length && lines[lines.length - 1].trim().startsWith('```')) lines.pop();
      s = lines.join('\n').trim();
      data = JSON.parse(s);
    }

    // Write pretty JSON
    fs.writeFileSync(OUT, JSON.stringify(data, null, 2), 'utf8');
    console.log('Wrote e2e result to', OUT);

    // Run validator
    console.log('Running validator...');
    const child = exec(`node "${VALIDATOR.replace(/\\/g, '\\\\')}"`, { cwd: path.dirname(VALIDATOR) });

    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => process.stderr.write(d));

    child.on('exit', code => {
      if (code === 0) {
        console.log('E2E RUN: PASSED');
        process.exit(0);
      } else {
        console.error('E2E RUN: FAILED (validator exit code', code, ')');
        process.exit(code || 1);
      }
    });
  } catch (err) {
    console.error('E2E RUN ERROR:', err.message || err);
    process.exit(2);
  }
})();
