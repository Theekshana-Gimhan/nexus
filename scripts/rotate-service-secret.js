const crypto = require('crypto');
const fs = require('fs');

const newSecret = crypto.randomBytes(24).toString('hex');
console.log('New service secret generated:');
console.log(newSecret);
console.log('\nNext steps:');
console.log('1) Update docker-compose.dev.yml: set SERVICE_CLIENT_SECRET under quickbooks-connector to the new secret.');
console.log('2) Update identity SERVICE_CLIENTS env to include quickbooks:' + newSecret + ' (or replace existing).');
console.log('3) Restart services: docker-compose -f docker-compose.dev.yml up -d --force-recreate');

// Optionally write to a local .secrets file (developer convenience)
fs.writeFileSync('.service_secret', newSecret);
console.log('\nWrote .service_secret in current directory (do not commit to git)');
