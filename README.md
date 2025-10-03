# MCP Hub 🚀

> The central registry and gateway for Model Context Protocol (MCP) servers

[![Deploy Worker](https://github.com/Abdelrahman-sadek/mcp-hub/actions/workflows/deploy-worker.yml/badge.svg)](https://github.com/Abdelrahman-sadek/mcp-hub/actions/workflows/deploy-worker.yml)
[![Integration Tests](https://github.com/Abdelrahman-sadek/mcp-hub/actions/workflows/integration-test.yml/badge.svg)](https://github.com/Abdelrahman-sadek/mcp-hub/actions/workflows/integration-test.yml)
[![Health Check](https://github.com/Abdelrahman-sadek/mcp-hub/actions/workflows/health-check.yml/badge.svg)](https://github.com/Abdelrahman-sadek/mcp-hub/actions/workflows/health-check.yml)

## 🌟 Overview

MCP Hub is a comprehensive registry, gateway, and orchestration layer for Model Context Protocol (MCP) servers. It provides a centralized platform for discovering, monitoring, and interacting with MCP servers across the ecosystem.

### ✨ Key Features

- **🔍 Server Discovery**: Browse and search a curated registry of MCP servers
- **💚 Health Monitoring**: Real-time health status and uptime tracking
- **🔄 Proxy Gateway**: Secure request proxying with authentication and rate limiting
- **🔗 Schema Federation**: Unified schema from multiple servers with conflict resolution
- **📊 Analytics**: Usage statistics and performance metrics
- **🎨 Modern UI**: Beautiful, responsive dashboard with dark/light mode
- **🚀 100% Free**: Built on free tier services (Cloudflare Workers + Cloudflare Pages)

## 🏗️ Architecture

### 🛠️ Tech Stack

**Frontend (Cloudflare Pages)**
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation

**Backend (Cloudflare Workers)**
- TypeScript with ES2022 target
- Cloudflare KV for storage
- Scheduled events for health checks
- Built-in rate limiting and caching

**CI/CD (GitHub Actions)**
- Automated deployments
- Health monitoring
- Performance auditing with Lighthouse
- Automated issue creation for failures

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (free tier)
- GitHub account

### 1. Clone the Repository

```bash
git clone https://github.com/Abdelrahman-sadek/mcp-hub.git
cd mcp-hub
```

### 2. Local Development

```bash
# Set up worker
cd worker
npm install
npm run dev

# Set up dashboard (in another terminal)
cd dashboard
npm install
npm run dev
```

### 3. Production Deployment

**Hybrid Architecture**: Cloudflare Pages (dashboard) + GitHub Actions (worker)

#### Configure Cloudflare Pages:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Connect your GitHub repository
3. Set build settings:
   - **Build command**: `cd dashboard && npm install && npm run build`
   - **Output directory**: `dashboard/dist`
   - **Environment variable**: `VITE_API_BASE_URL=https://mcp-hub-worker.tito-7t.workers.dev`

#### Enable GitHub Actions:
1. Go to repository Settings → Actions → Enable workflows
2. Add secrets in Settings → Secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
   - `CLOUDFLARE_SUBDOMAIN`: tito-7t

## 📁 Project Structure

```
mcp-hub/
├── .github/workflows/     # GitHub Actions
├── worker/               # Cloudflare Worker (API)
│   ├── src/
│   │   ├── index.ts     # Main entry point
│   │   ├── router.ts    # Request routing
│   │   ├── registry.ts  # Server registry
│   │   ├── auth.ts      # Authentication
│   │   ├── cache.ts     # Caching layer
│   │   └── types.ts     # TypeScript types
│   ├── package.json
│   ├── wrangler.toml
│   └── tsconfig.json
├── dashboard/            # React Dashboard
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utilities
│   │   └── types.ts     # TypeScript types
│   ├── public/
│   │   └── servers.json # Server registry
│   ├── package.json
│   └── vite.config.ts
├── scripts/             # Utility scripts
├── docs/               # Documentation
└── README.md
```

## 📖 API Documentation

### Base URL
```
https://mcp-hub-worker.tito-7t.workers.dev
```

### Endpoints

#### List Servers
```http
GET /api/servers?search=ai&verified=true&health=online&limit=20&offset=0
```

#### Get Server Details
```http
GET /api/servers/{server-id}
```

#### Health Check
```http
GET /api/health?force=true
```

#### Proxy Request
```http
POST /api/proxy
Content-Type: application/json

{
  "serverId": "example-server",
  "path": "/tools/list",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

#### Federated Schema
```http
GET /api/schema?refresh=true
```

#### Submit Server
```http
POST /api/submit
Content-Type: application/json

{
  "name": "My MCP Server",
  "description": "A powerful MCP server",
  "url": "https://my-server.com",
  "version": "1.0.0",
  "tags": ["ai", "tools"],
  "author": {
    "name": "Your Name",
    "github": "yourusername"
  }
}
```

## 🎨 Features

- **Server Registry**: Browse and discover MCP servers
- **Health Monitoring**: Real-time server status tracking
- **Search & Filter**: Find servers by name, tags, or capabilities
- **Schema Federation**: Unified API schemas across servers
- **Proxy Gateway**: Secure request proxying
- **Rate Limiting**: 100 requests/minute per IP
- **Caching**: 5-minute response caching
- **Dark Mode**: Full dark/light theme support
- **Responsive Design**: Mobile-first responsive layout

## 🚦 Current Status

### ✅ Completed Features

- **✅ Phase 1-3**: Core infrastructure and dashboard
- **✅ Phase 4-6**: Health monitoring, proxy, and schema federation
- **✅ Phase 7-9**: Complete dashboard, GitHub Actions, and documentation
- **✅ Phase 10**: Testing infrastructure and TypeScript optimization
- **✅ Hybrid Deployment**: Cloudflare Pages + Workers architecture

### 🔄 Deployment Status

- **Dashboard**: Ready for Cloudflare Pages deployment
- **Worker API**: Ready for GitHub Actions deployment
- **Integration**: Automated testing configured
- **Documentation**: Complete with deployment guides

### 🎯 Next Steps

1. Complete Cloudflare Pages configuration
2. Enable GitHub Actions and add secrets
3. Verify end-to-end functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Dashboard](https://mcp-hub.pages.dev/)
- [Worker API](https://mcp-hub-worker.tito-7t.workers.dev/api/health)
- [GitHub Repository](https://github.com/Abdelrahman-sadek/mcp-hub)
- [API Documentation](docs/API.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Overview](ARCHITECTURE.md)

---

Built with ❤️ for the MCP community
