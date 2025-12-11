# API Documentation

## Overview

TheLux MCP App exposes two sets of APIs:

1. **Web App API** (`/api/*`) - Next.js API routes for frontend interactions
2. **MCP Service API** (`/tool/*`) - HTTP shim for MCP-style tool execution

---

## Web App API

### Base URL
- Development: `http://localhost:3000`
- Production: `https://app.thelux.app`

### POST /api/ai

Generate website content using AI with tool-calling capabilities.

**Request:**

```json
{
  "prompt": "Create a restaurant homepage with hero section and menu"
}
```

**Response:**

Streaming text response (Server-Sent Events style):

```
TOOL_CALL: search_templates({"query":"restaurant hero section"})
TOOL_RESULT: {"result":[{"id":1,"score":0.92,"payload":{...}}]}
ASSISTANT: I've found a great restaurant template. Creating your page...
TOOL_CALL: save_page({"subdomain":"my-restaurant","path":"/","ast":{...}})
TOOL_RESULT: {"ok":true}
ASSISTANT: Your page has been saved successfully!
```

**Headers:**
- `Content-Type: text/plain; charset=utf-8`
- `Cache-Control: no-cache`

**Status Codes:**
- `200`: Success (streaming response)
- `400`: Missing prompt
- `500`: Server error

**Example:**

```javascript
const response = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Restaurant homepage' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

---

## MCP Service API

### Base URL
- Development: `http://localhost:8710`
- Production (internal): `http://mcp:8710`

### GET /health

Health check endpoint.

**Response:**

```json
{
  "ok": true
}
```

**Status Codes:**
- `200`: Service is healthy
- `500`: Service is unhealthy

---

### POST /tool/search_templates

Perform semantic search on templates using Qdrant vector database.

**Request:**

```json
{
  "query": "modern restaurant hero section with dark theme"
}
```

**Response:**

```json
{
  "result": [
    {
      "id": 1,
      "version": 0,
      "score": 0.9234,
      "payload": {
        "title": "Restaurant Hero - Dark",
        "industry": "restaurant",
        "theme": "dark",
        "ast": {
          "type": "section",
          "components": [...]
        }
      }
    },
    {
      "id": 5,
      "version": 0,
      "score": 0.8876,
      "payload": {
        "title": "Bistro Landing Page",
        "industry": "restaurant",
        "ast": {...}
      }
    }
  ],
  "time": 0.034
}
```

**Process:**
1. Query is embedded using OpenAI `text-embedding-3-small` (1536 dimensions)
2. Qdrant performs cosine similarity search
3. Top 5 results returned with scores

**Status Codes:**
- `200`: Success
- `500`: Embedding or Qdrant error

---

### POST /tool/save_page

Save or update a page for a site.

**Request:**

```json
{
  "subdomain": "my-restaurant",
  "path": "/",
  "ast": {
    "type": "page",
    "meta": {
      "title": "Best Restaurant in Town",
      "description": "Fine dining experience"
    },
    "sections": [
      {
        "type": "hero",
        "heading": "Welcome to Our Restaurant",
        "subheading": "Experience culinary excellence",
        "cta": { "text": "Book Now", "link": "/booking" }
      },
      {
        "type": "menu",
        "items": [...]
      }
    ]
  }
}
```

**Response:**

```json
{
  "ok": true
}
```

**Database Operations:**
1. Upserts `sites` table (creates if doesn't exist)
2. Upserts `pages` table (updates if path exists)
3. Sets `updated_at` timestamp

**Status Codes:**
- `200`: Success
- `500`: Database error

---

### POST /tool/put_asset

Upload a file to MinIO object storage.

**Request:**

```json
{
  "key": "images/hero-background.jpg",
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "contentType": "image/jpeg"
}
```

**Response:**

```json
{
  "key": "images/hero-background.jpg",
  "url": "http://minio:9000/thelux/images/hero-background.jpg"
}
```

**Process:**
1. Decode base64 to Buffer
2. Upload to MinIO bucket (default: `thelux`)
3. Return public URL

**Status Codes:**
- `200`: Success
- `500`: MinIO error

**Notes:**
- Max file size: Depends on MinIO configuration (default: 5GB)
- Supported types: Any (images, videos, documents, etc.)
- Files are publicly readable if bucket policy allows

---

### POST /tool/notify

Send a notification via Apprise service.

**Request:**

```json
{
  "message": "New site created: my-restaurant.thelux.app"
}
```

**Response:**

```json
{
  "ok": true,
  "response": "Notification sent successfully"
}
```

**Status Codes:**
- `200`: Success (even if Apprise unavailable)
- `500`: Unexpected error

**Supported Channels:**
Depends on Apprise configuration. Examples:
- Email (SMTP)
- Slack webhooks
- Discord webhooks
- Telegram bots
- SMS (Twilio)

---

### POST /tool/trigger_flow

Trigger an n8n workflow via webhook.

**Request:**

```json
{
  "url": "https://n8n.example.com/webhook/abc123",
  "payload": {
    "event": "site_created",
    "subdomain": "my-restaurant",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response:**

```json
{
  "status": 200,
  "text": "Workflow triggered successfully"
}
```

**Status Codes:**
- `200`: Success
- `500`: n8n webhook error

**Use Cases:**
- Post-site creation automations
- Backup triggers
- Analytics events
- Third-party integrations

---

## Tool Schemas (OpenAI Function Calling)

The Web App provides these tool definitions to OpenAI:

### search_templates

```json
{
  "name": "search_templates",
  "description": "Semantic search templates by query",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Natural language search query"
      }
    },
    "required": ["query"]
  }
}
```

### save_page

```json
{
  "name": "save_page",
  "description": "Save AST to a site/path",
  "parameters": {
    "type": "object",
    "properties": {
      "subdomain": {
        "type": "string",
        "description": "Site subdomain (e.g., 'my-restaurant')"
      },
      "path": {
        "type": "string",
        "description": "Page path (e.g., '/', '/about')"
      },
      "ast": {
        "type": "object",
        "description": "Page Abstract Syntax Tree (JSON)"
      }
    },
    "required": ["subdomain", "path", "ast"]
  }
}
```

### put_asset

```json
{
  "name": "put_asset",
  "description": "Upload a base64 asset to object storage",
  "parameters": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "description": "Storage key (path)"
      },
      "base64": {
        "type": "string",
        "description": "Base64-encoded file content"
      },
      "contentType": {
        "type": "string",
        "description": "MIME type (e.g., 'image/jpeg')"
      }
    },
    "required": ["key", "base64", "contentType"]
  }
}
```

### notify

```json
{
  "name": "notify",
  "description": "Send a notification via Apprise",
  "parameters": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "description": "Notification message"
      }
    },
    "required": ["message"]
  }
}
```

---

## Authentication

Currently, **no authentication** is implemented. Recommended additions:

### For Production

```javascript
// Middleware example
const authMiddleware = async (req) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401 };
  
  // Verify JWT with Keycloak/Auth0
  const user = await verifyToken(token);
  if (!user) return { error: 'Invalid token', status: 401 };
  
  return { user };
};
```

### Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

Not currently implemented. Recommended:

```javascript
// Per-user rate limit
const limit = 100; // requests per hour
const window = 3600; // seconds

// Track in Redis
await redis.incr(`rate:${userId}`);
await redis.expire(`rate:${userId}`, window);
```

---

## Error Responses

All endpoints return JSON errors:

```json
{
  "error": "Error message here"
}
```

Common errors:

| Code | Message | Meaning |
|------|---------|---------|
| 400 | Missing prompt | Required field not provided |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not found | Resource doesn't exist |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Internal server error | Server-side error |

---

## Environment Variables

### Required for Web App

```env
OPENAI_API_KEY=sk-...           # OpenAI API key
OPENAI_MODEL=gpt-4o-mini        # Model to use
MCP_URL=http://mcp:8710         # MCP service URL
```

### Required for MCP Service

```env
DATABASE_URL=postgres://...     # PostgreSQL connection string
QDRANT_URL=http://qdrant:6333   # Qdrant instance URL
QDRANT_COLLECTION=templates     # Collection name
OPENAI_API_KEY=sk-...           # For embeddings
MINIO_ENDPOINT=minio            # MinIO host
MINIO_PORT=9000                 # MinIO port
MINIO_ACCESS_KEY=minioadmin     # MinIO access key
MINIO_SECRET_KEY=minioadmin     # MinIO secret key
MINIO_BUCKET=thelux             # Bucket name
```

---

## OpenAI API Usage

### Models Used

| Purpose | Model | Dimensions | Cost (per 1M tokens) |
|---------|-------|------------|----------------------|
| Text generation | gpt-4o-mini | - | $0.15 / $0.60 |
| Embeddings | text-embedding-3-small | 1536 | $0.02 |

### Token Optimization

- Use `gpt-4o-mini` for cost efficiency
- Cache template embeddings (don't re-embed)
- Limit context window size
- Stream responses to improve UX

---

## Testing Examples

### cURL Examples

```bash
# Test health endpoint
curl http://localhost:8710/health

# Search templates
curl -X POST http://localhost:8710/tool/search_templates \
  -H "Content-Type: application/json" \
  -d '{"query":"modern hero section"}'

# Save a page
curl -X POST http://localhost:8710/tool/save_page \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain":"test",
    "path":"/",
    "ast":{"type":"page","sections":[]}
  }'

# AI generation (streaming)
curl -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Restaurant homepage"}' \
  --no-buffer
```

### JavaScript Examples

```javascript
// Using fetch with streaming
async function generateSite(prompt) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    console.log(text);
  }
}

// Call MCP tool directly
async function searchTemplates(query) {
  const response = await fetch('http://localhost:8710/tool/search_templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  return await response.json();
}
```

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/iboss21/mcptheluxapp/issues
- Documentation: README.md, ARCHITECTURE.md, INSTALLATION.md
