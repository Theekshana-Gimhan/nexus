import { Router } from 'express';
let swaggerUi: any = null;
const path = require('path');
const specPath = path.join(__dirname, '..', 'docs', 'openapi.json');
const spec = require(specPath);

const router = Router();

try {
  // Attempt to load swagger-ui-express if installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  swaggerUi = require('swagger-ui-express');
} catch (err) {
  // dependency not installed — fall back to raw spec
  swaggerUi = null;
}

if (swaggerUi) {
  router.use('/', swaggerUi.serve, swaggerUi.setup(spec));
} else {
  // simple human-readable HTML fallback
  router.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<html><body><h1>Nexus Identity Service API</h1><p>Swagger UI not installed. Raw spec available at <a href="/docs/spec">/docs/spec</a></p></body></html>`);
  });
}

// Also expose raw spec at /docs/spec
router.get('/spec', (_req, res) => {
  res.json(spec);
});

export default router;
