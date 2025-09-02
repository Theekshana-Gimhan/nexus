const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, 'e2e_result.json');

try {
  const raw = fs.readFileSync(file, 'utf8');

    // Clean common noisy prefixes/suffixes (markdown fences, stray characters)
    let cleaned = raw.replace(/\uFEFF/, ''); // strip BOM
    const lines = cleaned.split(/\r?\n/);
    if (lines.length && lines[0].trim().startsWith('```')) lines.shift();
    if (lines.length && lines[lines.length - 1].trim().startsWith('```')) lines.pop();
    cleaned = lines.join('\n').trim();

    const obj = JSON.parse(cleaned);
  const errors = [];

  if (obj.success !== true) errors.push('success !== true');
  if (!Array.isArray(obj.data)) errors.push('data is not an array');
  if (Array.isArray(obj.data) && obj.data.length === 0) errors.push('data array is empty');

  if (Array.isArray(obj.data)) {
    obj.data.forEach((t, i) => {
      if (!t.id) errors.push(`item[${i}].id missing`);
      if (!t.name) errors.push(`item[${i}].name missing`);
      if (!t.domain) errors.push(`item[${i}].domain missing`);
      if (!t.settings || typeof t.settings !== 'object') errors.push(`item[${i}].settings missing or invalid`);
      else {
        if (!t.settings.currency) errors.push(`item[${i}].settings.currency missing`);
        if (typeof t.settings.maxUsers !== 'number') errors.push(`item[${i}].settings.maxUsers not a number`);
      }
    });
  }

  if (errors.length) {
    console.error('E2E VALIDATION FAILED');
    errors.forEach(e => console.error('- ' + e));
    process.exit(1);
  }

  console.log('E2E VALIDATION PASSED');
  process.exit(0);
} catch (err) {
  console.error('E2E VALIDATION ERROR:', err.message);
  process.exit(2);
}
