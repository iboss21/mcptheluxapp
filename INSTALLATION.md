# Installation Guide

## Prerequisites

Before installing TheLux MCP App, ensure you have the following:

- **Node.js** 20.x or later
- **Docker** and **Docker Compose** (for running dependencies)
- **PostgreSQL** 14+ database
- **OpenAI API Key** (for AI features and embeddings)

### Optional Services
- **Qdrant** - Vector database for template search (recommended)
- **MinIO** - Object storage for assets (recommended)
- **Apprise** - Notification service (optional)
- **n8n** - Workflow automation (optional)

## Quick Start (Development)

### 1. Clone the Repository

```bash
git clone https://github.com/iboss21/mcptheluxapp.git
cd mcptheluxapp
```

### 2. Set Up the Database

Run the initialization SQL script:

```bash
psql -U postgres -d thelux < sql/001_init.sql
```

Or with Docker:

```bash
docker run -d \
  --name thelux-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=thelux \
  -p 5432:5432 \
  postgres:16-alpine

# Wait for DB to start, then:
docker exec -i thelux-postgres psql -U postgres -d thelux < sql/001_init.sql
```

### 3. Set Up Qdrant (Optional but Recommended)

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  qdrant/qdrant
```

Create the templates collection:

```bash
curl -X PUT "http://localhost:6333/collections/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }'
```

### 4. Set Up MinIO (Optional but Recommended)

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 5. Configure the MCP Service

```bash
cd services/mcp
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=8710
DATABASE_URL=postgres://postgres:postgres@localhost:5432/thelux
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=templates
OPENAI_API_KEY=sk-your-key-here
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=thelux
```

Install dependencies and start:

```bash
npm install
npm run dev
```

### 6. Configure the Web App

```bash
cd apps/web
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
MCP_URL=http://localhost:8710
```

Install dependencies and start:

```bash
npm install
npm run dev
```

### 7. Access the Application

Open your browser and navigate to:

- **Web App**: http://localhost:3000
- **MCP Health Check**: http://localhost:8710/health

## Production Deployment (Coolify)

### Prerequisites

- Coolify instance running
- Domain name configured (e.g., `app.thelux.app`)

### 1. Add Services to Coolify

#### MCP Service

1. Create new service in Coolify
2. Set name: `mcp`
3. Set port: `8710`
4. Set as internal service (no public domain)
5. Add environment variables from `.env.example`

#### Web App

1. Create new Next.js app in Coolify
2. Set domain: `app.thelux.app`
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Add environment variables:
   - `MCP_URL=http://mcp:8710`
   - `OPENAI_API_KEY=sk-...`
   - `OPENAI_MODEL=gpt-4o-mini`

### 2. Configure DNS

Add an A record for your domain:

```
app.thelux.app → [Your server IP]
```

### 3. Deploy

Push your code to the repository, and Coolify will automatically build and deploy both services.

## Docker Compose (All-in-One)

For a complete local setup, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: thelux
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./sql/001_init.sql:/docker-entrypoint-initdb.d/001_init.sql

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant-data:/qdrant/storage

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data

  mcp:
    build: ./services/mcp
    ports:
      - "8710:8710"
    environment:
      PORT: 8710
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/thelux
      QDRANT_URL: http://qdrant:6333
      QDRANT_COLLECTION: templates
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_SSL: false
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
      MINIO_BUCKET: thelux
    depends_on:
      - postgres
      - qdrant
      - minio

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_MODEL: gpt-4o-mini
      MCP_URL: http://mcp:8710
    depends_on:
      - mcp

volumes:
  postgres-data:
  qdrant-data:
  minio-data:
```

Run with:

```bash
OPENAI_API_KEY=sk-your-key docker-compose up
```

## Seeding Template Data

To populate Qdrant with starter templates:

```bash
# Create sample template embeddings
curl -X PUT "http://localhost:6333/collections/templates/points" \
  -H "Content-Type: application/json" \
  -d '{
    "points": [
      {
        "id": 1,
        "vector": [0.1, 0.2, ...],
        "payload": {
          "title": "Restaurant Hero Section",
          "industry": "restaurant",
          "ast": {...}
        }
      }
    ]
  }'
```

## Troubleshooting

### Database Connection Failed

- Verify PostgreSQL is running: `psql -U postgres -l`
- Check DATABASE_URL format: `postgres://user:pass@host:port/db`
- Ensure database exists: `createdb thelux`

### MCP Service Not Responding

- Check logs: `npm run dev` in `services/mcp`
- Verify port 8710 is not in use: `lsof -i :8710`
- Test health endpoint: `curl http://localhost:8710/health`

### OpenAI API Errors

- Verify API key is valid
- Check your OpenAI account has credits
- Ensure API key has access to `gpt-4o-mini` and `text-embedding-3-small`

### Qdrant Collection Not Found

- Create collection: See step 3 above
- Verify Qdrant is running: `curl http://localhost:6333/collections`

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
- Check [API.md](./API.md) for endpoint documentation
- See [README.md](./README.md) for feature overview
- Visit the admin panel at `/admin` (after creating a user)
