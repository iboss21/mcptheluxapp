# @thelux/web (Next.js)

- Chat endpoint `/api/ai` calls OpenAI **Responses API** with **tool-calls**.
- Tool calls are **bridged** to the MCP server via HTTP, so the model can:
  - search templates (Qdrant)
  - save pages (Postgres)
  - upload assets (MinIO)
  - notify (Apprise)
- Streams logs of the multi-turn model/tool execution to the browser.

Env:
```
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
MCP_URL=http://mcp:8710
```
