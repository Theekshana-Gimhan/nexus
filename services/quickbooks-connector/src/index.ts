import express from 'express';
import { config } from 'dotenv';
import oauthRoutes from './routes/oauth';
import syncRoutes from './routes/sync';

config();

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'quickbooks-connector' }));
app.use('/oauth', oauthRoutes);
app.use('/sync', syncRoutes);

const PORT = parseInt(process.env.PORT || '3010');
app.listen(PORT, () => console.log(`QuickBooks connector running on port ${PORT}`));
