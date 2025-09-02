E2E helper scripts

- run_e2e.js: Calls the internal debug endpoint, writes `e2e_result.json`, and runs the validator (`validate_e2e.js`).

How to run locally

1. Ensure API Gateway is running (development mode recommended so `/internal/debug/proxy-tenants` is available):

   $env:NODE_ENV='development'
   npm run dev

2. Run the e2e script from the `services/api-gateway` directory:

   node ./scripts/run_e2e.js

CI usage

- The project exposes `npm run e2e` and `npm run e2e:ci` which run the same script and will exit with non-zero when validation fails. Ensure the gateway and tenant services are reachable from the CI environment before running.
