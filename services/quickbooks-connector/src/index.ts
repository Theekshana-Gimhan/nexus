import express from 'express';
const cookieParser = require('cookie-parser');
import rateLimit from 'express-rate-limit';
const morgan = require('morgan');
import https from 'https';
import fs from 'fs';
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());
app.use(cookieParser());

// basic rate limiter for admin endpoints
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api/admin', adminLimiter);

// audit logging
app.use(morgan('combined'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'quickbooks-connector' }));

async function start() {
		// Dynamically import routes to avoid static ESM resolution issues in some runtimes.
		// Try .ts first (ts-node/esm), then fall back to .js (compiled output).
		async function tryImport(basePath: string) {
			try {
				return await import(`${basePath}.ts`);
			} catch (e1) {
				try {
					return await import(`${basePath}.js`);
				} catch (e2) {
					// final attempt without extension (some loaders resolve automatically)
					return await import(basePath);
				}
			}
		}

		const oauthMod = await tryImport('./routes/oauth');
		const syncMod = await tryImport('./routes/sync');
		const adminMod = await tryImport('./routes/admin');

		const oauthRoutes = oauthMod && oauthMod.default ? oauthMod.default : oauthMod;
		const syncRoutes = syncMod && syncMod.default ? syncMod.default : syncMod;

	app.use('/oauth', oauthRoutes);
	app.use('/sync', syncRoutes);

	// Admin UI and APIs
	if (adminMod) {
		const adminRoutes = adminMod && adminMod.default ? adminMod.default : adminMod;
		app.use('/api/admin', adminRoutes);
		app.use('/admin', express.static(require('path').join(__dirname, '..', 'admin')));
	}

	const PORT = parseInt(process.env.PORT || '3010');

	// Try to start HTTPS server in dev if certs exist
	const certPath = require('path').join(__dirname, '..', '..', 'certs');
	const keyFile = certPath + '/key.pem';
	const certFile = certPath + '/cert.pem';
	if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
		const options = { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) };
		https.createServer(options, app).listen(PORT, () => console.log(`QuickBooks connector (HTTPS) running on port ${PORT}`));
	} else {
		app.listen(PORT, () => console.log(`QuickBooks connector running on port ${PORT}`));
	}
}

start().catch((err) => {
	console.error('Failed to start application', err?.message || err);
	process.exit(1);
});
