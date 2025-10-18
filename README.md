# TheLux "Vibe Coding" MCP Micro‑SaaS (Coolify)

This monorepo gives you a **vibe‑coded website builder** with an **AI backend** that calls **MCP‑style tools** to pull templates (Qdrant), save pages (Postgres), store assets (MinIO), and trigger automations (n8n).

## Services you already run (fits right in)

- Postgres, MinIO, Qdrant, n8n, Apprise (all optional but supported here)

## Deploy on Coolify (2 apps)

1) **@thelux/mcp** → service named `mcp` (HTTP shim on port 8710)
   - Domain: internal only (no public domain required)
   - ENV: see `services/mcp/.env.example`

2) **@thelux/web** → Next.js app
   - Domain: `app.thelux.app` (or any)
   - ENV: set `MCP_URL=http://mcp:8710`, `OPENAI_*`

> Add DNS: `app.thelux.app` (A record). For multi‑tenant published sites, follow the earlier starter (`*.sites.thelux.app`).

## Qdrant collection (1536 dims for `text-embedding-3-small`)

```
curl -X PUT "$QDRANT_URL/collections/templates" -H "Content-Type: application/json" -d '{
  "vectors": { "size": 1536, "distance": "Cosine" }
}'
```

Seed with 10–20 starter templates (title, industry, JSON AST) using Qdrant `/points` API.

## Flow (runtime)

- User types a vibe prompt → Web calls OpenAI Responses with **tools**.
- When the model decides to use a tool:
  - `search_templates` → MCP shim → Qdrant
  - `save_page` → MCP shim → Postgres
  - `put_asset` → MCP shim → MinIO
  - `notify` / `trigger_flow` → Apprise / n8n
- App streams the trace back to the user.

## Next steps

- Add Keycloak OIDC to Web (Auth) and map `users` to `sites`.
- Add subdomain routing & publish flow (see previous starter you downloaded).
- Add credit checks before `/api/ai`.
- Replace HTTP shim with a **real MCP server** using `@modelcontextprotocol/sdk` when ready.
