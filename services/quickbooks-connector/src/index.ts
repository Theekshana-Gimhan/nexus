import express from 'express';
import { config } from 'dotenv';

config();

const app = express();
app.use(express.json());

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

		const oauthRoutes = oauthMod && oauthMod.default ? oauthMod.default : oauthMod;
		const syncRoutes = syncMod && syncMod.default ? syncMod.default : syncMod;

	app.use('/oauth', oauthRoutes);
	app.use('/sync', syncRoutes);

	const PORT = parseInt(process.env.PORT || '3010');
	app.listen(PORT, () => console.log(`QuickBooks connector running on port ${PORT}`));
}

start().catch((err) => {
	console.error('Failed to start application', err?.message || err);
	process.exit(1);
});
