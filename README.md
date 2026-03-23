# Leadflow Backend (Microservices)

This is a separate backend layer so UI does **not** directly interact with DB or third-party APIs.

## Services

- **gateway** (`:8080`)
  - Single entrypoint for UI.
  - Routes requests to internal services.
- **auth-service** (`:8081`)
  - Login/signup/session/logout.
- **core-engine** (`:8082`)
  - Business logic + DB access (Supabase in current implementation).
- **outgoing-adapter** (`:8083`)
  - All outgoing third-party calls (SMS/Email/Ads/CRM integrations).
- **incoming-adapter** (`:8084`)
  - All incoming webhooks/callbacks from external providers.

## Request flow

UI -> Gateway -> (Auth/Core/Outgoing/Incoming service) -> DB / Third-party APIs

## Local setup

1. `cd backend`
2. `cp .env.example .env` and fill Supabase + PostgreSQL values
3. `npm install`
4. Run each service in separate terminals:
   - `npm run dev:gateway`
   - `npm run dev:auth`
   - `npm run dev:core`
   - `npm run dev:outgoing`
   - `npm run dev:incoming`

## Frontend integration

Set in frontend `.env`:

```env
VITE_API_GATEWAY_URL=http://localhost:8080/api
```

After this, frontend will call:
- `/api/auth/*` for authentication
- `/api/core/*` for DB-backed business endpoints
- `/api/webhooks/*` for webhook endpoint CRUD (proxied to core-engine)

No direct UI database access should be used.

## Database ownership

- Webhooks are now served by backend Express APIs backed by direct PostgreSQL queries (`DATABASE_URL`) instead of Edge Function calls.
- UI only calls gateway/backend APIs; all DB access is server-side.


## Webhooks docs

- API usage: `backend/docs/webhooks-api.md`
- Architecture/need/maintainability guide: `backend/docs/webhooks-maintainability.md`
