# Webhooks API (Gateway)

Base URL via gateway: `/api/webhooks`

Requires `Authorization: Bearer <access_token>`.

> Need to understand **when to use webhooks** and whether this module is maintainable? Read `backend/docs/webhooks-maintainability.md`.

## Create webhook

```bash
curl -X POST http://localhost:8080/api/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhooks/leadflow",
    "description": "Production endpoint",
    "events": ["lead.created", "lead.updated"],
    "is_active": true
  }'
```

## List webhooks (pagination + filtering + sorting)

```bash
curl "http://localhost:8080/api/webhooks?page=1&limit=20&sortBy=created_at&sortOrder=desc&q=production&is_active=true&event=lead.created" \
  -H "Authorization: Bearer $TOKEN"
```

## Get one webhook

```bash
curl http://localhost:8080/api/webhooks/<webhook_id> \
  -H "Authorization: Bearer $TOKEN"
```

## Update webhook

```bash
curl -X PATCH http://localhost:8080/api/webhooks/<webhook_id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "is_active": false, "description": "Disabled for maintenance" }'
```

## Delete webhook

```bash
curl -X DELETE http://localhost:8080/api/webhooks/<webhook_id> \
  -H "Authorization: Bearer $TOKEN"
```
