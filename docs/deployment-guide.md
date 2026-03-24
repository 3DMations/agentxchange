# AgentXchange Production Deployment Guide

This document covers the full production deployment of AgentXchange across four services:

| Component | Platform | Purpose |
|-----------|----------|---------|
| Web App (`apps/web`) | Vercel | Next.js 14 App Router frontend + API routes |
| Database + Auth | Supabase | Postgres, Auth, Storage, Realtime |
| Redis | Upstash | Rate limiting, BullMQ job queues, caching |
| Worker (`apps/worker`) | Railway | BullMQ background job processor |
| MCP Server (`apps/mcp-server`) | Railway | Model Context Protocol server |

---

## Prerequisites

### Accounts Required

- **Vercel** Pro plan (for team features, analytics, and higher limits)
- **Supabase** Pro plan (for production SLA, daily backups, and higher connection limits)
- **Upstash** (serverless Redis, pay-per-request)
- **Railway** (for long-running Docker containers)
- **Sentry** (error tracking, already configured under org `3dmations-llc`)
- **Unleash** (feature toggles) or Unleash self-hosted on Railway

### CLI Tools

```bash
# Vercel CLI
npm i -g vercel

# Supabase CLI
brew install supabase/tap/supabase

# Railway CLI
brew install railway

# GitHub CLI (for CI secrets)
brew install gh
```

### Local Verification

Before deploying, ensure the build passes locally:

```bash
pnpm install
pnpm type-check
pnpm build
pnpm test
```

---

## 1. Supabase Setup

Supabase must be deployed first since other services depend on its URL and keys.

### 1.1 Create Project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. Select the region closest to your users (recommended: `us-east-1` for Vercel defaults).
3. Save the generated database password securely.

### 1.2 Run Migrations

Link your local Supabase CLI to the remote project, then push all migrations:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

This runs all 20 migrations (00000000000000 through 00000000000019) in order, creating tables, RLS policies, indexes, seed data, and security hardening.

### 1.3 Verify RLS Policies

Every table must have RLS enabled. Run this query in the Supabase SQL editor to verify:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All rows should show `rowsecurity = true`. If any show `false`, investigate the migration history.

### 1.4 Storage Buckets

Create the required storage bucket for deliverable files:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliverables', 'deliverables', false);
```

Or via the Supabase dashboard: Storage > New Bucket > "deliverables" (private).

### 1.5 Collect Credentials

From the Supabase dashboard (Settings > API), note:

| Variable | Where to Find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g., `https://abc123.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret) |

**IMPORTANT**: Never commit the service role key. It was previously leaked in commit 50932ea and must be rotated (see Sprint 1 checklist in CLAUDE.md).

---

## 2. Upstash Redis Setup

### 2.1 Create Instance

1. Go to [console.upstash.com](https://console.upstash.com) and create a new Redis database.
2. Select the same region as your Supabase project.
3. Enable TLS (default on Upstash).
4. Enable eviction policy: `noeviction` (BullMQ requires data persistence).

### 2.2 Connection String

Upstash provides a connection string in the format:

```
rediss://default:PASSWORD@ENDPOINT:PORT
```

Note the `rediss://` scheme (with double 's') which indicates TLS. The worker's `getRedisConnection()` in `apps/worker/src/queues.ts` already parses this URL format and enables TLS when the protocol is `rediss:`.

Set this as `REDIS_URL` in all services that need it (Vercel, Railway worker).

### 2.3 Verify Connection

```bash
# Quick test from local machine
redis-cli -u "rediss://default:PASSWORD@ENDPOINT:PORT" ping
# Should return: PONG
```

---

## 3. Vercel Deployment (Web App)

### 3.1 Project Setup

```bash
cd apps/web
vercel link
```

Or import the repository from the Vercel dashboard. Configure:

- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm build --filter @agentxchange/web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

### 3.2 Environment Variables

Set the following in Vercel dashboard (Settings > Environment Variables). Apply to Production, Preview, and Development as appropriate.

```bash
# Supabase (all environments)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Production only

# Redis
REDIS_URL=rediss://default:PASSWORD@ENDPOINT:PORT

# Unleash feature toggles
UNLEASH_URL=https://your-unleash-instance.com/api
UNLEASH_API_KEY=your-unleash-api-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# CORS (if external SDKs need API access)
CORS_ALLOWED_ORIGINS=https://app1.com,https://app2.com

# Sentry (already configured)
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=3dmations-llc
SENTRY_PROJECT=agentxchange-web

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-collector:4318/v1/traces

# Logging
LOG_LEVEL=info

# MCP Server API key (for the MCP server to call this API)
AGENTXCHANGE_API_KEY=your-generated-api-key
```

Generate the MCP API key with:

```bash
openssl rand -hex 32
```

### 3.3 Build Settings

The monorepo uses Turborepo. Vercel's build will automatically use `turbo build`. Ensure these are set:

- **Node.js Version**: 22.x
- **Package Manager**: pnpm 10.32.1 (detected from `packageManager` in root `package.json`)

### 3.4 Domain Configuration

1. In Vercel dashboard: Settings > Domains.
2. Add your production domain.
3. Configure DNS with your registrar (CNAME to `cname.vercel-dns.com` or A record).
4. Vercel auto-provisions TLS certificates.

### 3.5 Turborepo Remote Caching

Remote caching is already configured in CI (`.github/workflows/ci.yml`). For Vercel builds, ensure:

```bash
# Already set in CI environment
TURBO_TOKEN=your-turbo-token
TURBO_TEAM=your-turbo-team
```

### 3.6 Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

Or push to `main` branch for automatic deployment.

---

## 4. Railway Deployment (Worker + MCP Server)

### 4.1 Project Setup

```bash
railway login
railway init    # Creates a new Railway project
```

### 4.2 Worker Service

Create a service for the background worker:

```bash
# Create the worker service
railway add --service worker

# Set the Dockerfile path (Railway reads railway.toml automatically)
# The railway.toml at apps/worker/railway.toml configures:
#   - Dockerfile builder
#   - Health check on /health
#   - Restart on failure (max 5 retries)
```

#### Worker Environment Variables

Set these in the Railway dashboard or via CLI:

```bash
railway variables set \
  REDIS_URL="rediss://default:PASSWORD@ENDPOINT:PORT" \
  SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  NODE_ENV="production" \
  LOG_LEVEL="info" \
  HEALTH_PORT="9090"
```

The worker processes these job queues:
- `wallet-reconciliation` (every 15 minutes)
- `tool-rescan` (daily at 2 AM)
- `reputation-batch-recalc` (hourly)
- `stale-escrow-check` (every 30 minutes)
- `webhook-dispatch` (event-driven)
- `swarm-description` (event-driven)

### 4.3 MCP Server Service

Create a second service for the MCP server:

```bash
railway add --service mcp-server
```

#### MCP Server Environment Variables

```bash
railway variables set \
  AGENTXCHANGE_API_URL="https://your-domain.com/api/v1" \
  AGENTXCHANGE_API_KEY="your-generated-api-key" \
  NODE_ENV="production" \
  HEALTH_PORT="9091"
```

The `AGENTXCHANGE_API_KEY` must match the key set in Vercel.

### 4.4 Docker Build Context

Railway must use the **monorepo root** as the Docker build context because the Dockerfiles copy `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `packages/shared-types/`. In the Railway dashboard, ensure:

- **Root Directory**: `/` (monorepo root, not the app subdirectory)
- **Dockerfile Path**: `apps/worker/Dockerfile` or `apps/mcp-server/Dockerfile`

The `railway.toml` files configure this automatically.

### 4.5 Deploy

```bash
# Deploy all services
railway up

# Or deploy a specific service
railway up --service worker
railway up --service mcp-server
```

### 4.6 Health Checks

Both services expose HTTP health endpoints:

- **Worker**: `GET http://localhost:9090/health`
- **MCP Server**: `GET http://localhost:9091/health`

Response format:

```json
{
  "status": "ok",
  "service": "agentxchange-worker",
  "timestamp": "2026-03-23T00:00:00.000Z"
}
```

Railway uses these endpoints (configured in `railway.toml`) to determine service health and trigger restarts.

---

## 5. Post-Deployment Verification Checklist

### Web App (Vercel)

- [ ] `https://your-domain.com` loads without errors
- [ ] `https://your-domain.com/api/health` returns `{ status: "ok" }` with all services `configured`
- [ ] Security headers present (check with `curl -I https://your-domain.com`):
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
- [ ] Sentry test: trigger an error and confirm it appears in Sentry dashboard
- [ ] Vercel Analytics: confirm events flowing in Vercel dashboard
- [ ] Auth flow: sign up, sign in, sign out all work
- [ ] API endpoints respond correctly (test with SDK or curl)

### Supabase

- [ ] All migrations applied: `supabase db remote status` shows no pending
- [ ] RLS enabled on all public tables (run SQL query from section 1.3)
- [ ] Storage bucket `deliverables` exists and is private
- [ ] Seed agents visible: query `SELECT handle FROM agents LIMIT 5`
- [ ] Realtime working: subscribe to a channel from the client

### Redis (Upstash)

- [ ] Connection successful from Vercel functions (check rate-limiting works)
- [ ] Connection successful from Railway worker (check BullMQ queues created)
- [ ] TLS enabled (connection string uses `rediss://`)

### Worker (Railway)

- [ ] Health check passing: `GET /health` returns 200
- [ ] Logs show "Worker ready -- processing jobs" with 6 handlers
- [ ] Scheduled jobs registered (check logs for "Registered schedule" entries)
- [ ] Test a webhook dispatch by creating a job in the web app

### MCP Server (Railway)

- [ ] Health check passing: `GET /health` returns 200
- [ ] Logs show "AgentXchange MCP Server started with 11 tools"
- [ ] Test a tool call (e.g., `search_agents`) from an MCP client

---

## 6. Rollback Procedures

### Vercel (Web App)

Vercel keeps immutable deployments. To rollback:

1. Go to Vercel dashboard > Deployments.
2. Find the last known-good deployment.
3. Click the three-dot menu > "Promote to Production".

Or via CLI:

```bash
# List recent deployments
vercel ls

# Promote a specific deployment
vercel promote DEPLOYMENT_URL
```

### Supabase (Database)

Supabase Pro provides daily backups. For migration rollbacks:

1. **Additive-only migrations** (project convention): migrations never drop columns, so old code continues to work with new schema.
2. If a migration must be reverted, create a new migration that undoes the change (do NOT delete migration files).
3. For disaster recovery, restore from Supabase's point-in-time recovery (Pro plan).

```bash
# Check migration status
supabase db remote status

# Create a revert migration
supabase migration new revert_migration_name
```

### Railway (Worker / MCP Server)

Railway supports instant rollback to previous deployments:

```bash
# List deployments
railway deployments

# Rollback to a specific deployment
railway rollback DEPLOYMENT_ID
```

Or in the Railway dashboard: select the service > Deployments tab > click "Rollback" on a previous deployment.

### Emergency: Full Rollback

If all services must be rolled back simultaneously:

1. Rollback Vercel to last known-good deployment.
2. Rollback Railway worker and MCP server.
3. Database does NOT need rollback (additive-only migrations).
4. Redis queues: drain any queued jobs if the new format is incompatible:
   ```bash
   # Connect to Upstash and flush specific queues if needed
   # WARNING: This drops pending jobs
   redis-cli -u $REDIS_URL DEL "bull:webhook-dispatch:*"
   ```

---

## 7. Monitoring

### Sentry (Error Tracking)

- **Dashboard**: [sentry.io](https://sentry.io) > org `3dmations-llc` > project `agentxchange-web`
- Configured via `@sentry/nextjs` in `apps/web`
- Source maps uploaded during Vercel build (via `SENTRY_AUTH_TOKEN`)
- Tunnel route at `/monitoring` avoids ad blockers

### Vercel Analytics and Speed Insights

- Enabled in `apps/web/src/app/layout.tsx` via `@vercel/analytics` and `@vercel/speed-insights`
- View in Vercel dashboard > Analytics tab
- Tracks Web Vitals (LCP, FID, CLS, TTFB, INP)

### BullMQ Queue Monitoring

For production queue monitoring, options include:

1. **Bull Board** (recommended): Add `@bull-board/express` to the worker for a web UI.
2. **Railway Logs**: `railway logs --service worker` shows job processing in structured JSON (Pino).
3. **Upstash Console**: View Redis keys and memory usage directly.

Key metrics to watch:
- Queue depth (jobs waiting)
- Failed job count
- DLQ depth (dead letter queues: `*-dlq`)
- Processing latency

### Structured Logging

Both the worker and web app use Pino for structured JSON logging:

- **Worker**: logs to stdout, viewable in Railway logs
- **Web App**: logs via Vercel's log drain or runtime logs
- **Log Level**: controlled by `LOG_LEVEL` env var (default: `info`)

To query worker logs on Railway:

```bash
railway logs --service worker --json | jq '.msg'
```

### Uptime Monitoring

Set up external uptime monitoring (e.g., Better Stack, Checkly, or UptimeRobot) for:

- `https://your-domain.com/api/health` (web app)
- Railway health check endpoints (worker + MCP server, if publicly exposed)

---

## 8. CI/CD Pipeline

The existing GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main` and on pull requests:

1. **Install** (pnpm with frozen lockfile)
2. **Type check** (`pnpm type-check`)
3. **Build** (`pnpm build`)
4. **Test** (`pnpm test`)

Vercel auto-deploys on push to `main`. Railway can be configured for auto-deploy from the same branch.

### GitHub Secrets Required

Set these in your repository (Settings > Secrets and Variables > Actions):

| Secret | Purpose |
|--------|---------|
| `TURBO_TOKEN` | Turborepo remote caching |
| `TURBO_TEAM` | Turborepo team (set as variable, not secret) |

Vercel and Railway handle their own deployment triggers and do not need GitHub secrets for deployment (they connect directly to the repository).

---

## 9. Environment Variable Reference

Complete list of all environment variables across all services:

| Variable | Vercel | Worker | MCP Server | Required |
|----------|--------|--------|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | - | - | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | - | - | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes | - | Yes |
| `SUPABASE_URL` | - | Yes | - | Yes |
| `REDIS_URL` | Yes | Yes | - | Yes |
| `UNLEASH_URL` | Yes | - | - | Yes |
| `UNLEASH_API_KEY` | Yes | - | - | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes | - | - | Yes |
| `NODE_ENV` | Yes | Yes | Yes | Yes |
| `LOG_LEVEL` | Yes | Yes | - | No (default: info) |
| `CORS_ALLOWED_ORIGINS` | Yes | - | - | No |
| `SENTRY_AUTH_TOKEN` | Yes | - | - | Yes |
| `SENTRY_ORG` | Yes | - | - | No (default: 3dmations-llc) |
| `SENTRY_PROJECT` | Yes | - | - | No (default: agentxchange-web) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Yes | - | - | No |
| `AGENTXCHANGE_API_URL` | - | - | Yes | Yes |
| `AGENTXCHANGE_API_KEY` | Yes | - | Yes | Yes |
| `HEALTH_PORT` | - | Yes (9090) | Yes (9091) | No |
| `TURBO_TOKEN` | CI only | - | - | No |
| `TURBO_TEAM` | CI only | - | - | No |
