# QuickBooks Connector (scaffold)

This is a lightweight connector scaffold to integrate QuickBooks Online with the Nexus platform.

Features
- OAuth start and callback routes (mock and real)
- Sync endpoint to pull invoices and push to Nexus
- Basic mapping helper for invoices
- Mock mode for local testing without QuickBooks credentials

Run locally
1. Install deps
   cd services/quickbooks-connector
   npm install

2. Copy env example
   cp .env.example .env
   # edit .env and set NEXUS_SERVICE_ACCOUNT_TOKEN and MOCK_MODE=true for local testing

3. Start the service
   npm run dev

Basic usage
- OAuth start: GET /oauth/start
- OAuth callback: GET /oauth/callback?code=... (or mock mode returns tokens)
- Pull invoices: GET /sync/pull/invoices (requires header Authorization: Bearer <NEXUS_SERVICE_ACCOUNT_TOKEN>)

Notes
- This scaffold does not persist tokens or store mappings. Add a DB layer for production.
- For QuickBooks production, implement token refresh and secure storage, and map Chart of Accounts.
