# TheLux MCP App - AI-Powered Website Builder

> **Vibe-coded website builder** with an **AI backend** that uses Model Context Protocol (MCP) tools to create, manage, and deploy websites powered by OpenAI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)

## 🚀 What is TheLux?

TheLux is a **micro-SaaS platform** that combines cutting-edge AI with Model Context Protocol (MCP) to revolutionize website building:

- 🎨 **AI Website Generation**: Describe your vision in natural language, get a complete website
- 🔧 **MCP Tools Integration**: Semantic template search, asset management, workflow automation
- 🗄️ **Multi-Tenant Architecture**: Host unlimited sites with subdomain routing
- ⚡ **Real-Time Streaming**: Watch as AI builds your site step-by-step
- 🎯 **Production Ready**: Deploy on Coolify, Docker, or any Node.js environment

### Key Features

- ✅ **Natural Language to Website**: "Create a restaurant homepage" → Complete site with hero, menu, booking CTA
- ✅ **Template Discovery**: AI searches 100s of templates using vector embeddings (Qdrant)
- ✅ **Asset Storage**: Upload images, videos, files to MinIO S3-compatible storage
- ✅ **Page Management**: Save/update pages as JSON AST in PostgreSQL
- ✅ **Notifications**: Trigger alerts via Apprise (Slack, Email, Discord, etc.)
- ✅ **Workflow Automation**: Connect to n8n for complex automations
- ✅ **Admin Panel**: Manage sites, users, and pages (coming soon)

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## ⚡ Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for dependencies)
- OpenAI API Key

### 1-Minute Setup

```bash
# Clone repository
git clone https://github.com/iboss21/mcptheluxapp.git
cd mcptheluxapp

# Start dependencies
docker-compose up -d

# Set up MCP service
cd services/mcp
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npm install
npm run dev

# In another terminal, set up Web app
cd apps/web
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npm install
npm run dev
```

Open http://localhost:3000 and start building! 🎉

## 🏗️ Architecture

TheLux consists of two main services:

```
┌─────────────────────────────────────────┐
│        User Browser                      │
│  (Landing, Chat, Admin Panel)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Web App (Next.js)                     │
│    • API Routes                          │
│    • AI Orchestration                    │
│    • UI Components                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    MCP Service (HTTP Shim)               │
│    • search_templates                    │
│    • save_page                           │
│    • put_asset                           │
│    • notify, trigger_flow                │
└──────┬──────┬──────┬──────┬─────────────┘
       │      │      │      │
       ▼      ▼      ▼      ▼
   Postgres Qdrant MinIO  n8n/Apprise
```

**Read more:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## 📦 Installation

### Option 1: Docker Compose (Recommended)

```bash
# Clone repo
git clone https://github.com/iboss21/mcptheluxapp.git
cd mcptheluxapp

# Create .env file
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Start everything
docker-compose up
```

Access at http://localhost:3000

### Option 2: Manual Setup

See [INSTALLATION.md](./INSTALLATION.md) for detailed instructions including:
- PostgreSQL setup
- Qdrant configuration
- MinIO setup
- Environment variables

### Option 3: Coolify Deployment

1. Create two apps in Coolify:
   - **mcp** (service, port 8710, internal only)
   - **web** (Next.js app, public domain)

2. Set environment variables (see `.env.example` files)

3. Deploy! Coolify auto-builds on git push.

**Read more:** [INSTALLATION.md](./INSTALLATION.md)

## 🎯 Usage

### Building a Website with AI

1. **Navigate to the app** (http://localhost:3000)

2. **Enter your prompt:**
   ```
   Create a modern restaurant homepage with:
   - Hero section with dark overlay and booking button
   - Featured menu items in 3 columns
   - Customer testimonials
   - Contact section with Google Maps
   ```

3. **Watch the magic:**
   ```
   TOOL_CALL: search_templates({"query":"restaurant hero dark"})
   TOOL_RESULT: Found 5 templates (score: 0.92)
   ASSISTANT: I found a perfect dark restaurant template...
   TOOL_CALL: save_page({"subdomain":"my-restaurant"...})
   TOOL_RESULT: {"ok":true}
   ASSISTANT: Your restaurant homepage is ready!
   ```

4. **Done!** Your site is saved and ready to publish.

### Admin Panel (Coming Soon)

Access at `/admin`:

- 📊 **Dashboard**: Analytics, site stats
- 🌐 **Sites Manager**: List all sites, edit pages
- 👥 **Users**: Manage accounts, credits
- ⚙️ **Settings**: Configure domains, integrations

### API Usage

```javascript
// Generate a site programmatically
const response = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Modern SaaS landing page with pricing table'
  })
});

// Stream responses
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

**Read more:** [API.md](./API.md)

## 📚 API Documentation

### Web App Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai` | POST | Generate site with AI (streaming) |
| `/admin/*` | GET/POST | Admin panel routes |

### MCP Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/tool/search_templates` | POST | Semantic template search |
| `/tool/save_page` | POST | Save page AST to database |
| `/tool/put_asset` | POST | Upload file to MinIO |
| `/tool/notify` | POST | Send notification via Apprise |
| `/tool/trigger_flow` | POST | Trigger n8n workflow |

**Full documentation:** [API.md](./API.md)

## 🚢 Deployment

### Production Checklist

- [ ] Set up PostgreSQL database
- [ ] Configure Qdrant vector database
- [ ] Set up MinIO for assets
- [ ] Add OPENAI_API_KEY to environment
- [ ] Configure domain DNS
- [ ] Enable HTTPS/SSL
- [ ] Add authentication (Keycloak, Auth0)
- [ ] Set up monitoring (Sentry, Prometheus)
- [ ] Configure backups

### Coolify (Recommended)

1. **MCP Service**
   - Name: `mcp`
   - Port: `8710`
   - Internal only (no domain)
   - Environment: Use `services/mcp/.env.example`

2. **Web App**
   - Domain: `app.thelux.app`
   - Build: `npm run build`
   - Start: `npm run start`
   - Environment: Use `apps/web/.env.example`
   - Set `MCP_URL=http://mcp:8710`

3. **Deploy**: Push to repository → Auto-deploy

### Docker Compose

```yaml
# See docker-compose.yml in repo
services:
  postgres:
    image: postgres:16-alpine
  qdrant:
    image: qdrant/qdrant
  minio:
    image: minio/minio
  mcp:
    build: ./services/mcp
  web:
    build: ./apps/web
```

Run: `docker-compose up -d`

## 🛠️ Development

### Project Structure

```
mcptheluxapp/
├── apps/
│   └── web/              # Next.js web application
│       ├── app/          # App Router pages
│       ├── api/          # API routes
│       └── components/   # React components
├── services/
│   └── mcp/              # MCP HTTP shim service
│       └── src/          # Tool implementations
├── sql/
│   └── 001_init.sql      # Database schema
├── INSTALLATION.md       # Setup guide
├── ARCHITECTURE.md       # System design
└── API.md                # API documentation
```

### Running Locally

```bash
# Terminal 1: MCP Service
cd services/mcp
npm run dev

# Terminal 2: Web App
cd apps/web
npm run dev

# Terminal 3: Dependencies
docker-compose up postgres qdrant minio
```

### Linting & Building

```bash
# Lint
cd apps/web && npm run lint

# Build
cd apps/web && npm run build

# Start production
cd apps/web && npm run start
```

### Adding New Tools

1. **Add tool to MCP service** (`services/mcp/src/index.js`):
   ```javascript
   async function my_new_tool({ param }) {
     // Implementation
     return { result: 'data' };
   }
   ```

2. **Add tool definition** (`apps/web/app/api/ai/route.ts`):
   ```typescript
   {
     name: 'my_new_tool',
     description: 'Does something cool',
     parameters: { ... }
   }
   ```

3. **Add route handler** (MCP service):
   ```javascript
   if (tool === 'my_new_tool') result = await my_new_tool(body);
   ```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: See INSTALLATION.md, ARCHITECTURE.md, API.md
- 🐛 **Issues**: [GitHub Issues](https://github.com/iboss21/mcptheluxapp/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/iboss21/mcptheluxapp/discussions)

## 🎯 Roadmap

### Current Version (v0.1.0)
- ✅ AI website generation
- ✅ MCP tool integration
- ✅ Template search (Qdrant)
- ✅ Basic UI

### Coming Soon
- 🚧 Landing page
- 🚧 Admin panel
- 🚧 User authentication
- 🚧 Subdomain routing
- 🚧 Credit system
- 🚧 Template marketplace

### Future
- 📅 Drag-and-drop editor
- 📅 Real-time collaboration
- 📅 White-label support
- 📅 Enterprise SSO
- 📅 Native MCP server (replace HTTP shim)

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 and embeddings
- **Qdrant** - Vector database
- **Next.js** - React framework
- **MCP** - Model Context Protocol
- **Coolify** - Deployment platform

---

**Built with ❤️ by the TheLux team**

[Website](https://thelux.app) • [Documentation](./INSTALLATION.md) • [GitHub](https://github.com/iboss21/mcptheluxapp)
