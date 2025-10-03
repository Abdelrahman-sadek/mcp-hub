# MCP Hub Deployment Guide 🚀

This guide provides step-by-step instructions for deploying MCP Hub to production using GitHub Pages and Cloudflare Workers.

## 📋 Prerequisites

### Required Accounts
- **GitHub Account**: For hosting the repository and GitHub Pages
- **Cloudflare Account**: For Workers and KV storage (free tier sufficient)

### Required Tools
- **Node.js 18+**: For local development and building
- **Git**: For version control
- **npm or yarn**: For package management

### Required Credentials
- Cloudflare API Token with Workers and KV permissions
- Cloudflare Account ID
- Cloudflare Worker subdomain

## 🔧 Step 1: Cloudflare Setup

### 1.1 Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com) and sign up for a free account
2. Complete email verification

### 1.2 Get Account ID
1. Go to Cloudflare Dashboard
2. In the right sidebar, copy your **Account ID**
3. Save this for later use as `CLOUDFLARE_ACCOUNT_ID`

### 1.3 Create API Token
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Custom token** template
4. Configure permissions:
   - **Account**: `Cloudflare Workers:Edit`
   - **Zone Resources**: `Include All zones`
   - **Account Resources**: `Include All accounts`
5. Click **Continue to summary** → **Create Token**
6. Copy the token and save as `CLOUDFLARE_API_TOKEN`

### 1.4 Create KV Namespaces
```bash
cd worker
npm install
npx wrangler login
npx wrangler kv:namespace create MCP_REGISTRY
npx wrangler kv:namespace create MCP_CACHE
```

Save the namespace IDs returned by these commands.

### 1.5 Update wrangler.toml
Edit `worker/wrangler.toml` and update the KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "MCP_REGISTRY"
id = "your-registry-namespace-id"

[[kv_namespaces]]
binding = "MCP_CACHE"
id = "your-cache-namespace-id"
```

### 1.6 Choose Worker Subdomain
1. Go to **Workers & Pages** in Cloudflare Dashboard
2. Note your subdomain (e.g., `your-subdomain.workers.dev`)
3. Save this as `CLOUDFLARE_SUBDOMAIN` (just the subdomain part, not the full URL)

## 🐙 Step 2: GitHub Repository Setup

### 2.1 Create GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click **New repository**
3. Repository name: `mcp-hub` (or your preferred name)
4. Description: `MCP Hub - Central registry and gateway for Model Context Protocol servers`
5. Set to **Public** (required for GitHub Pages free tier)
6. **Do NOT** initialize with README, .gitignore, or license (we have these files)
7. Click **Create repository**

### 2.2 Configure GitHub Secrets
1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `CLOUDFLARE_API_TOKEN` | Your API token from Step 1.3 | API token for Workers deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID from Step 1.2 | Cloudflare account identifier |
| `CLOUDFLARE_SUBDOMAIN` | Your subdomain from Step 1.6 | Worker subdomain (e.g., `my-subdomain`) |

### 2.3 Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Source: **GitHub Actions**
3. This will be automatically configured when you push the code

## 🧪 Step 3: Local Testing

### 3.1 Test Worker Locally
```bash
cd worker
npm install
npm run dev
```

Visit `http://localhost:8787/api/servers` to test the API.

### 3.2 Test Dashboard Locally
```bash
cd dashboard
npm install
npm run dev
```

Visit `http://localhost:3000` to test the dashboard.

### 3.3 Run Tests
```bash
# Test worker
cd worker
npm test

# Test dashboard
cd dashboard
npm test
```

## 🚀 Step 4: Deploy to GitHub

### 4.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "🎉 Initial commit: Complete MCP Hub implementation

- ✅ Cloudflare Worker with TypeScript
- ✅ React dashboard with Vite and Tailwind
- ✅ Health monitoring system
- ✅ Proxy functionality
- ✅ Schema federation
- ✅ GitHub Actions workflows
- ✅ Comprehensive documentation
- ✅ Unit and component tests"
```

### 4.2 Add GitHub Remote
```bash
git remote add origin https://github.com/YOUR_USERNAME/mcp-hub.git
git branch -M main
```

### 4.3 Push to GitHub
```bash
git push -u origin main
```

## ✅ Step 5: Verify Deployment

### 5.1 Check GitHub Actions
1. Go to your repository → **Actions**
2. You should see workflows running:
   - **Deploy Cloudflare Worker**
   - **Deploy GitHub Pages**
   - **Health Check**

### 5.2 Verify Worker Deployment
1. Wait for the worker deployment to complete
2. Visit: `https://mcp-hub-worker.YOUR_SUBDOMAIN.workers.dev/api/health`
3. You should see a JSON response with health status

### 5.3 Verify Pages Deployment
1. Wait for the pages deployment to complete
2. Visit: `https://YOUR_USERNAME.github.io/mcp-hub`
3. You should see the MCP Hub dashboard

### 5.4 Test End-to-End
1. Open the dashboard
2. Navigate to different pages (Browse, Add Server, Docs)
3. Check that the health status is displayed
4. Verify that the API endpoints are working

## 🔧 Step 6: Post-Deployment Configuration

### 6.1 Update API Base URL
The dashboard should automatically use the correct API URL, but verify in the browser console that API calls are successful.

### 6.2 Add Initial Servers
1. Go to the **Add Server** page
2. Submit a few test servers to populate the registry
3. Verify they appear in the **Browse** page

### 6.3 Monitor Health Checks
1. Check that the health check workflow runs every 30 minutes
2. Verify that server health statuses are updated
3. Monitor for any GitHub Issues created by failed health checks

## 🐛 Troubleshooting

### Common Issues

#### Worker Deployment Fails
- **Check API Token**: Ensure it has correct permissions
- **Check Account ID**: Verify it matches your Cloudflare account
- **Check KV Namespaces**: Ensure they exist and IDs are correct in wrangler.toml

#### Pages Deployment Fails
- **Check Repository Visibility**: Must be public for free GitHub Pages
- **Check Build Errors**: Review the Actions logs for build failures
- **Check Base Path**: Ensure `base: '/mcp-hub/'` is set in vite.config.ts

#### API Calls Fail
- **CORS Issues**: Check that CORS headers are properly set in the worker
- **Rate Limiting**: Verify you're not hitting rate limits
- **KV Storage**: Ensure KV namespaces are properly configured

#### Health Checks Not Working
- **Cron Triggers**: Verify cron triggers are set in wrangler.toml
- **Permissions**: Check that the worker can access external URLs
- **Timeout Issues**: Ensure health check timeout is reasonable

### Debug Commands

```bash
# Check worker logs
npx wrangler tail

# Test worker locally with KV
npx wrangler dev --local

# Check KV namespace contents
npx wrangler kv:key list --binding MCP_REGISTRY

# Force deploy worker
npx wrangler deploy --force

# Check GitHub Actions logs
# Go to repository → Actions → Select workflow run
```

### Getting Help

- **GitHub Issues**: Create an issue in the repository
- **Cloudflare Docs**: [developers.cloudflare.com](https://developers.cloudflare.com)
- **GitHub Pages Docs**: [docs.github.com/pages](https://docs.github.com/pages)

## 🔄 Updating the Deployment

### Code Updates
1. Make changes to your code
2. Commit and push to main branch
3. GitHub Actions will automatically deploy updates

### Configuration Updates
1. Update secrets in GitHub repository settings
2. Update wrangler.toml for worker configuration
3. Redeploy if necessary

### Rollback
```bash
# Rollback worker to previous version
npx wrangler rollback

# Rollback pages via git
git revert HEAD
git push origin main
```

---

🎉 **Congratulations!** Your MCP Hub is now deployed and ready to serve the MCP community!
