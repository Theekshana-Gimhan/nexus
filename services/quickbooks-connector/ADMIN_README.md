QuickBooks Connector - Admin UI

Usage

- Start the dev bootstrap from repo root:

```powershell
npm run dev:bootstrap
```

- Open the admin UI in your browser:

http://localhost:3010/admin/

APIs

- GET /api/admin/mappings - list mappings
- GET /api/admin/mappings/:realmId - get single mapping
- POST /api/admin/mappings - create mapping { realmId, tenantId, companyName }
- DELETE /api/admin/mappings/:realmId - delete mapping

Notes

- The admin UI is intentionally minimal (vanilla JS) to avoid adding a full frontend dependency.
- The admin endpoints are unsecured; do not expose this to the public network. For production, add authentication and role checks.
