# Webhooks: Need, Scope, and Maintainability

This document explains **why Webhooks exist in this system**, when they are useful, and whether the current backend implementation is maintainable.

---

## 1) Why Webhooks are needed

Webhooks are for **server-to-server event delivery**.

They are needed when tenant customers want to receive events from Leadflow in their own systems (CRM, ERP, internal automation, Slack bots, custom backends) without polling.

Typical events from this product domain:
- `lead.created`
- `lead.updated`
- `lead.status_changed`
- plus additional domain events as product evolves.

### What webhooks are NOT for

Webhooks are **not required** just to make Leadflow’s own UI real-time.

If the requirement is only in-app live updates, use frontend real-time channels (WebSocket/SSE/realtime subscriptions). Webhooks should remain for external integrations and automation.

---

## 2) Decision rule: should we keep webhooks?

Keep webhooks if at least one of these is true:
- Tenants integrate Leadflow events with third-party platforms.
- Tenants run backend automations triggered by Leadflow events.
- You need auditable external event delivery records (success/failure attempts).

If none are true, webhooks can be removed as a feature to reduce complexity.

---

## 3) Current backend architecture (maintainability view)

The implementation is maintainable because responsibilities are split by layer:

- `router.ts`
  - HTTP transport concerns only (auth checks, request validation result handling, response mapping).
- `service.ts`
  - PostgreSQL data access with parameterized SQL and business operations.
- `validators.ts`
  - zod schemas and small helpers.
- `index.ts`
  - module exports.

This separation reduces coupling, makes tests easier, and keeps each file focused.

---

## 4) Maintainability checklist (current status)

### Good
- Feature-folder modular structure (`router`/`service`/`validators`).
- Parameterized SQL (no string interpolation for values).
- Input validation with zod.
- RBAC + company scoping in backend.
- Delivery log and audit log support.

### Keep improving (recommended)
- Add integration tests for route + DB behavior.
- Add DB migration ownership notes for webhook schema changes.
- Add retry policy and dead-letter queue documentation.
- Add webhook signature verification examples for tenant receivers.
- Add OpenAPI spec for `/api/webhooks` endpoints.

---

## 5) Real-time UI vs Webhooks (clear separation)

- **UI real-time updates**: WebSocket/SSE/realtime subscription (in-app UX).
- **Webhooks**: outbound server callback to customer systems (external automation/integration).

These solve different problems and can coexist.

---

## 6) Data flow summary

1. UI configures webhook endpoint via `/api/webhooks`.
2. Backend stores endpoint + secret + event subscriptions.
3. Domain event happens (lead/deal/etc.).
4. Dispatcher sends signed payload to tenant endpoint.
5. Delivery status is stored in `webhook_events`.
6. Tenant reviews delivery logs in Webhooks page.

---

## 7) Recommendation

For this repository, keep webhooks as an **integration boundary feature**, not as the mechanism for UI live refresh.

That keeps architecture clean:
- UI live state = frontend realtime strategy.
- External event delivery = backend webhook strategy.
