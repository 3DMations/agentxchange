# AgentXchange — Claude Code Guide

## Project Overview
AI Agent Marketplace built as a pnpm monorepo with Next.js 14 (App Router) + Supabase + TypeScript.

## Architecture
- **Full-stack**: Next.js 14 App Router at `apps/web/`
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Shared types**: `packages/shared-types/` — all cross-module interfaces
- **MCP Server**: `apps/mcp-server/` — separate long-running process
- **Worker**: `apps/worker/` — BullMQ background job processor
- **Infrastructure**: Redis (cache/queue), Unleash (feature toggles)

## Key Commands
```bash
pnpm install                              # Install all dependencies
pnpm dev                                  # Start all apps
pnpm build                                # Build all packages
pnpm test                                 # Run all tests
pnpm type-check                           # TypeScript check
pnpm --filter @agentxchange/web dev       # Start just the web app
pnpm --filter @agentxchange/shared-types build  # Build shared types
```

## Global Rules
1. TDD-first: write failing test before implementation. Target ≥80% coverage.
2. Contract-first API: OpenAPI spec is source of truth.
3. Feature toggles on every user-facing feature.
4. Additive-only DB migrations (never rename/delete columns).
5. Idempotency keys on all write operations.
6. All shared types in `packages/shared-types` — never duplicate.
7. Structured logging with Pino.
8. No secrets in code — use env vars.
9. Supabase migrations are source of truth for schema.
10. RLS on every table.

## API Response Pattern
All API routes return `ApiResponse<T>` envelope: `{ data, error, meta }`.
Use `apiSuccess()` and `apiError()` from `lib/utils/api-response.ts`.

## Middleware Stack
Routes use composable HOFs: `withAuth(withRateLimit(withFeatureToggle('name', handler)))`.

## Module Build Order
0. ✅ Project Scaffolding
1. ✅ OpenAPI Spec & Contract Foundation
2. ✅ Auth & Identity
3. ✅ Agent Profiles & Search
4. ✅ Skill Catalog
5. ✅ Job Exchange
6. ✅ Markdown Deliverable Pipeline
7. ✅ Wallet & Settlement
8. ✅ Reputation Engine
9. ✅ Tiered Zones & XP Engine
10. ✅ AI Tool Registry
11. ✅ Moderation & Trust Safety
12. ✅ Webhooks & Realtime
13. ✅ Admin Dashboard
14. ✅ MCP Server
15. ✅ SDKs (auto-generate from OpenAPI)
16. ✅ Background Worker

## Phase 2 — Production Readiness & Launch Prep

### Sprint 1: Security Hardening (P0)
- [x] CRITICAL: Rotate Supabase service role key — `sb_secret_N7UND0...` leaked in git commit 50932ea (integration.test.ts fallback)
- [x] CRITICAL: Remove hardcoded key fallback from integration.test.ts
- [x] Add missing RLS policies (migration 00000000000012):
  - disputes UPDATE (for resolution by assigned moderator/admin)
  - deliverables UPDATE (for runSafetyScans)
  - zone_config UPDATE (for admin zone management)
  - sanctions INSERT/UPDATE (for moderator actions)
- [x] Add RPC input validation: amount>0, rating 1-5, null checks (wallet, XP functions)
- [x] Add security headers to next.config.js (CSP, X-Frame-Options, HSTS, nosniff, Referrer-Policy)
- [ ] Sanitize API error messages — generic to client, details to server logs
- [x] Fix `detectCollusion` query injection in moderation.service.ts
- [x] Fix `searchTools` ilike injection in tool-registry.service.ts
- [x] Add rate limiting to 15 routes missing it (admin, job ops, tool ops, wallet ops)
- [x] Add feature toggles to 15 routes missing them
- [x] Add Zod validation for zone config PUT request body
- [x] Add idempotency middleware to skills DELETE route
- [x] Add admin auth guard at frontend layout level

### Sprint 2: SDK & Type Alignment
- [ ] Add missing shared-types fields: recency_decay (Reputation), sample_deliverable_id/last_used_at/updated_at (Skill), reason (Dispute), approved_at/swarm_confidence_score (AiTool)
- [ ] Implement webhook subscription API routes OR remove phantom SDK methods
- [ ] Fix SDK createSkill() — make tags/ai_tools_used required per OpenAPI spec
- [ ] Align MCP tool parameter names with SDK/OpenAPI
- [ ] Fix MCP submit-deliverable schema (content vs deliverable_id mismatch)
- [ ] Add missing indexes: disputes.priority, webhook_event_log.subscription_id, agents.suspension_status, wallet_ledger(agent_id,type)
- [ ] Add idempotency middleware to skills DELETE route

### Sprint 3: CI/CD + Infrastructure
- [ ] GitHub Actions workflow: install → type-check → lint → test → build
- [ ] Enable Turborepo remote caching
- [ ] Add error.tsx, not-found.tsx, loading.tsx for dashboard routes
- [ ] Add CORS configuration for external SDK/API access
- [ ] Create .env.production.example with all required vars
- [ ] Add Sentry error tracking
- [ ] Set up Vercel Analytics + Speed Insights

### Sprint 4: Wire Up MCP Server
- [ ] Install @modelcontextprotocol/sdk dependency
- [ ] Replace TODO stub with actual Server wiring and tool handlers
- [ ] Connect tool definitions to ApiClient with real implementations
- [ ] Fix submit-deliverable schema mismatch
- [ ] Add MCP error handling and retry logic
- [ ] Add MCP server tests

### Sprint 5: Wire Up Background Worker
- [ ] Install BullMQ dependency and wire to Redis
- [ ] Implement actual job dispatch from services (webhook events, reputation recalc)
- [ ] Add graceful shutdown handling
- [ ] Add dead letter queue for failed jobs
- [ ] Add batch size limits to reputation-recalc
- [ ] Replace swarm-description stub with real implementation

### Sprint 6: A2A Protocol + Launch Prep
- [ ] Implement A2A Agent Cards from agent profiles (JSON capability descriptions)
- [ ] Add A2A task lifecycle endpoints mapped to job system
- [ ] Seed 20-30 reference agents across code_generation, data_analysis, content_creation
- [ ] Configure initial take rate (10-15%) via wallet platform_fee
- [ ] Add fee holiday feature toggle
- [ ] Production deployment: Vercel Pro + Supabase Pro + Upstash Redis + Railway (worker/MCP)

### Known Audit Findings (from 2026-03-20 ten-agent audit)
- CRITICAL: Supabase service_role key leaked in git history (commit 50932ea, integration.test.ts)
- CRITICAL: 4 tables missing RLS policies that will cause production failures (disputes, deliverables, zone_config, sanctions)
- Worker (apps/worker/) is stubs only — no BullMQ integration, no job dispatch
- MCP Server (apps/mcp-server/) is stubs only — no tool handler implementations
- 15 routes missing rate limiting, 15 missing feature toggles
- No security headers on any response (CSP, HSTS, X-Frame-Options)
- Zone visibility logic duplicated between app code and RLS policies
- Rate limit middleware fails open when Redis unavailable
- Feature toggles default enabled when Unleash unavailable (Vercel)
- URL param extraction uses unsafe indexOf pattern across 23 routes
- No error boundaries, loading states, or 404 pages in frontend
- No CI/CD pipeline
- OpenAPI ↔ route alignment: EXCELLENT (100% match on all 38 endpoints)
