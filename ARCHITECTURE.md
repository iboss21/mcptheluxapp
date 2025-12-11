# Architecture Overview

## System Design

TheLux MCP App is a **micro-SaaS platform** that combines AI-powered website generation with Model Context Protocol (MCP) tools. It's designed as a monorepo with two main components:

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Web App (Next.js)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • Landing Page                                       │  │
│  │  • Chat Interface (AI Builder)                        │  │
│  │  • Admin Panel                                        │  │
│  │  • API Routes (/api/ai)                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ REST API
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenAI Responses API                            │
│  • GPT-4o-mini for generation                                │
│  • Tool-calling capabilities                                 │
│  • text-embedding-3-small for vectors                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Tool Execution
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP Service (HTTP Shim)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tool Endpoints:                                      │  │
│  │  • POST /tool/search_templates                        │  │
│  │  • POST /tool/save_page                               │  │
│  │  • POST /tool/put_asset                               │  │
│  │  • POST /tool/notify                                  │  │
│  │  • POST /tool/trigger_flow                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────┬──────────┬──────────┬──────────┬──────────────────┘
         │          │          │          │
         ▼          ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Postgres│ │ Qdrant │ │ MinIO  │ │ n8n    │
    │        │ │        │ │        │ │Apprise │
    └────────┘ └────────┘ └────────┘ └────────┘
```

## Components

### 1. Web App (`apps/web`)

**Technology Stack:**
- Next.js 14 with App Router
- React 18 (Server & Client Components)
- TypeScript
- Server-Side Rendering (SSR)

**Key Features:**
- **Landing Page**: Marketing site with features, pricing, and CTA
- **AI Chat Interface**: Real-time streaming AI responses
- **Admin Panel**: Site management, user admin, analytics
- **API Routes**: Backend endpoints for AI interactions

**Responsibilities:**
- User interface rendering
- Authentication & authorization
- OpenAI API orchestration
- Tool-call bridging to MCP service
- Response streaming to client

### 2. MCP Service (`services/mcp`)

**Technology Stack:**
- Node.js HTTP server
- PostgreSQL client (pg)
- MinIO client
- Native fetch API

**Key Features:**
- **HTTP Shim**: Exposes MCP-style tools as HTTP endpoints
- **Database Operations**: CRUD for sites, pages, users
- **Vector Search**: Semantic template discovery via Qdrant
- **Asset Management**: File uploads to object storage
- **Notifications**: Apprise integration

**Responsibilities:**
- Execute tool calls from Web App
- Interact with external services (DB, Qdrant, MinIO)
- Handle embeddings via OpenAI
- Return structured results

### 3. External Services

#### PostgreSQL
- **Purpose**: Primary database for structured data
- **Schema**:
  - `users`: User accounts
  - `sites`: Multi-tenant site configurations
  - `pages`: Page content stored as JSON AST
  - `credits`: Usage tracking per user

#### Qdrant
- **Purpose**: Vector database for semantic search
- **Use Case**: Find relevant templates based on user prompts
- **Configuration**: 1536-dimension vectors (OpenAI text-embedding-3-small)

#### MinIO
- **Purpose**: S3-compatible object storage
- **Use Case**: Store uploaded assets (images, videos, files)
- **Bucket**: `thelux`

#### Apprise (Optional)
- **Purpose**: Multi-platform notification service
- **Use Case**: Send notifications to users (email, Slack, etc.)

#### n8n (Optional)
- **Purpose**: Workflow automation
- **Use Case**: Trigger complex workflows based on events

## Data Flow

### AI Website Generation Flow

1. **User Input**
   - User enters a prompt: "Create a restaurant homepage"
   - Web App `/api/ai` endpoint receives request

2. **OpenAI Tool-Calling Loop**
   - App calls OpenAI Responses API with available tools
   - Model analyzes prompt and decides which tools to call
   - Example: `search_templates({ query: "restaurant hero section" })`

3. **Tool Execution**
   - Web App forwards tool call to MCP Service: `POST /tool/search_templates`
   - MCP Service:
     - Embeds query using OpenAI embeddings
     - Searches Qdrant for similar templates
     - Returns top 5 matches

4. **Model Continuation**
   - Web App feeds tool results back to OpenAI
   - Model uses results to generate page AST
   - Model may call `save_page` tool to persist data

5. **Response Streaming**
   - Each step is streamed to browser in real-time
   - User sees: "TOOL_CALL: search_templates", "TOOL_RESULT: {...}", "ASSISTANT: ..."

### Page Persistence Flow

1. **Save Trigger**
   - Model calls `save_page({ subdomain: "my-restaurant", path: "/", ast: {...} })`
   
2. **MCP Processing**
   - Upserts `sites` table with subdomain
   - Upserts `pages` table with AST (JSONB)
   - Returns `{ ok: true }`

3. **Future Retrieval**
   - Admin panel queries pages by site
   - Published sites render pages from AST

## Security Considerations

### Current Implementation
- No authentication on Web App (add OAuth/OIDC)
- No rate limiting (add per-user quotas)
- Admin panel unprotected (add role checks)

### Recommended Additions
- **Authentication**: Keycloak, Auth0, or Clerk
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Per-user API call limits
- **Input Validation**: Sanitize all user inputs
- **SQL Injection**: Using parameterized queries (pg)
- **XSS Protection**: React's built-in escaping

## Scaling Considerations

### Horizontal Scaling
- **Web App**: Stateless, can scale infinitely behind load balancer
- **MCP Service**: Stateless, can scale with multiple instances
- **Database**: Use read replicas for analytics queries
- **Qdrant**: Supports clustering for high availability

### Caching
- **Redis**: Cache template search results
- **CDN**: Static assets (images, CSS, JS)
- **Page Cache**: Pre-render common pages

### Performance Optimizations
- **Database Indexes**: On `subdomain`, `path`, `user_id`
- **Connection Pooling**: Already implemented in MCP service
- **Lazy Loading**: Load admin panel resources on demand

## Development Workflow

### Local Development
1. Start dependencies: `docker-compose up -d`
2. Run MCP service: `cd services/mcp && npm run dev`
3. Run Web app: `cd apps/web && npm run dev`

### Testing Strategy
- **Unit Tests**: Individual tool functions
- **Integration Tests**: API endpoint flows
- **E2E Tests**: Full user journeys (Playwright)

### CI/CD Pipeline
1. Lint: `npm run lint`
2. Build: `npm run build`
3. Test: `npm test` (when tests exist)
4. Deploy: Coolify auto-deploy on push

## Future Enhancements

### Near-Term
- [ ] Add authentication (Keycloak OIDC)
- [ ] Implement admin panel
- [ ] Add user dashboard
- [ ] Credit/usage tracking UI

### Mid-Term
- [ ] Subdomain routing for published sites
- [ ] Template marketplace
- [ ] Drag-and-drop page builder
- [ ] Real-time collaboration

### Long-Term
- [ ] Replace HTTP shim with native MCP server
- [ ] Support for multiple AI providers
- [ ] White-label capabilities
- [ ] Enterprise SSO integration

## Technology Choices

### Why Next.js?
- Server-side rendering for SEO
- API routes for backend logic
- React Server Components for performance
- Large ecosystem and community

### Why MCP?
- Standardized tool interface
- Future compatibility with Claude Desktop, ChatGPT
- Composable tool architecture
- Easy to extend with new capabilities

### Why Qdrant?
- Purpose-built for vector search
- Better performance than pgvector for large datasets
- REST API for easy integration
- Supports filtering and hybrid search

### Why PostgreSQL?
- ACID compliance for transactional data
- JSONB for flexible schema (page AST)
- Mature ecosystem and tooling
- Strong community support

## Monitoring & Observability

### Recommended Tools
- **Logs**: Winston, Pino (structured logging)
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Errors**: Sentry

### Key Metrics
- **Web App**: Response time, error rate, active users
- **MCP Service**: Tool execution time, DB query performance
- **OpenAI**: Token usage, cost per request
- **Database**: Connection pool size, query latency

## Deployment Environments

### Development
- Local Docker Compose
- Hot reloading enabled
- Debug logging on

### Staging
- Coolify preview deployments
- Separate database instance
- Feature flags for testing

### Production
- Coolify main deployment
- Automated backups (database, Qdrant)
- CDN for static assets
- Health checks and auto-restart
