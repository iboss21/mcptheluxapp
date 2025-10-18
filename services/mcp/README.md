# @thelux/mcp (HTTP shim exposing MCP tools)

This service exposes HTTP endpoints that mirror MCP tools your LLM can call via the Web app:

- `POST /tool/search_templates` → Qdrant semantic search (embeds with OpenAI `text-embedding-3-small`, 1536 dims)
- `POST /tool/save_page` → upsert page AST in Postgres
- `POST /tool/put_asset` → store asset in MinIO bucket
- `POST /tool/notify` → send notification via Apprise
- `POST /tool/trigger_flow` → call an n8n webhook

> You can later **swap the HTTP shim with a full MCP Server** using `@modelcontextprotocol/sdk` if you want Claude/ChatGPT to connect directly. This shim keeps the app simple on day‑1.

Env to set (Coolify):
```
DATABASE_URL=postgres://user:pass@host:5432/db
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=templates
OPENAI_API_KEY=sk-...
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_SSL=false
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=thelux
APPRISE_URL=http://apprise-api:8000/notify
```
