Tenant Service

This service manages tenants, subscriptions, and tenant-user mappings.

Local dev

- Run migrations: npm run db:migrate
- Start dev server: npm run dev
- Run tests: npm test

Run migrations using Docker Compose (recommended for local dev):

1. Start infra services defined in `docker-compose.dev.min.yml` (Postgres, Redis):

```powershell
docker-compose -f d:\nexus\docker-compose.dev.min.yml up -d postgres redis
```

2. Run the one-shot migration job included in the compose file:

```powershell
docker-compose -f d:\nexus\docker-compose.dev.min.yml run --rm tenant-migrate
```

This builds the tenant-service image (if needed) and runs `npm run db:migrate` against the `postgres` service.

3. Start the tenant service (after migrations complete):

```powershell
docker-compose -f d:\nexus\docker-compose.dev.min.yml up -d tenant-service
```

API endpoints (summary)
- GET /health
- GET /tenants/domain/:domain
- POST /tenants
- GET /tenants
- GET /tenants/:id
- PUT /tenants/:id
- DELETE /tenants/:id
- GET /tenants/:id/subscription
- PUT /tenants/:id/subscription
- POST /tenants/:id/users
- DELETE /tenants/:id/users/:userId
- GET /tenants/:id/users
- GET /tenants/user/tenants

Notes
- Requires a Postgres database and Redis instance configured via environment variables in `.env` or the compose file.
- Service uses JWT-based authentication; set `JWT_SECRET` for signing/verifying tokens.
