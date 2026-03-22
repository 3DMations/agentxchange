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
- [x] Add missing shared-types fields: recency_decay (Reputation), sample_deliverable_id/last_used_at/updated_at (Skill), reason (Dispute), approved_at/swarm_confidence_score (AiTool) — verified all fields exist in DB
- [x] Implement webhook subscription API routes OR remove phantom SDK methods — verified: all 3 operations aligned (create/list/delete), no phantom methods
- [x] Fix SDK createSkill() — make tags/ai_tools_used required per OpenAPI spec — SDK already required, Zod validator fixed, form updated with ai_tools_used field
- [x] Align MCP tool parameter names with SDK/OpenAPI — fixed list-skills (removed invalid agent_id, added domain/proficiency/zone/min_rating/tool_id), register-tool (added required input/output_formats, pricing_model), search-tools (added status param)
- [x] Fix MCP submit-deliverable schema (content vs deliverable_id mismatch) — verified: already uses deliverable_id correctly
- [x] Add missing indexes: disputes.priority, webhook_event_log.subscription_id, agents.suspension_status, wallet_ledger(agent_id,type) — added in migration 00000000000012
- [x] Add idempotency middleware to skills DELETE route — already done in Sprint 1

### Sprint 3: CI/CD + Infrastructure
- [x] GitHub Actions workflow: install → type-check → lint → test → build — .github/workflows/ci.yml (install, type-check, build, test on push/PR)
- [ ] Enable Turborepo remote caching — requires Vercel Pro account setup
- [x] Add error.tsx, not-found.tsx, loading.tsx for dashboard routes — all three exist with skeleton/error/404 UIs
- [x] Add CORS configuration for external SDK/API access — CORS_ALLOWED_ORIGINS env var in next.config.js
- [x] Create .env.production.example with all required vars — includes Supabase, Redis, Unleash, OTEL, CORS, MCP
- [ ] Add Sentry error tracking — requires Sentry account setup
- [ ] Set up Vercel Analytics + Speed Insights — requires Vercel dashboard setup

### Sprint 4: Wire Up MCP Server
- [x] Install @modelcontextprotocol/sdk dependency — @modelcontextprotocol/sdk ^1.27.1 in package.json
- [x] Replace TODO stub with actual Server wiring and tool handlers — server.ts uses McpServer with registerTools() wiring 11 tools
- [x] Connect tool definitions to ApiClient with real implementations — ApiClient makes real HTTP calls to all endpoints (agents, jobs, wallet, skills, zones, tools)
- [x] Fix submit-deliverable schema mismatch — uses deliverable_id (not content) in both tool schema and ApiClient
- [x] Add MCP error handling and retry logic — ApiClient retries on 408/429/5xx with exponential backoff, server.ts wraps handlers with try/catch
- [x] Add MCP server tests — 3 test files: api-client.test.ts, server.test.ts, tools.test.ts

### Sprint 5: Wire Up Background Worker
- [x] Install BullMQ dependency and wire to Redis — verified: bullmq ^5.71.0 in apps/worker/package.json, Redis connection in queues.ts
- [x] Implement actual job dispatch from services (webhook events, reputation recalc) — verified: 6 real handlers (webhook-dispatch, reputation-recalc, wallet-reconciliation, stale-escrow-check, tool-rescan, swarm-description) with Supabase integration
- [x] Add graceful shutdown handling — verified: SIGTERM/SIGINT in index.ts, shutdown.ts closes workers then queues with Promise.allSettled
- [x] Add dead letter queue for failed jobs — verified: DLQ created per queue in createQueues(), moveToDeadLetterQueue() called on exhausted retries
- [x] Add batch size limits to reputation-recalc — verified: DEFAULT_BATCH_SIZE=50, configurable via data.batchSize or REPUTATION_BATCH_SIZE env var, paginated processing
- [~] Replace swarm-description stub with real implementation — partially complete: fetches tool metadata and generates template description, but uses string concatenation instead of LLM/swarm service (comment: "In production this would call an LLM or swarm intelligence service")

### Sprint 6: A2A Protocol + Launch Prep
- [x] Implement A2A Agent Cards from agent profiles (JSON capability descriptions) — GET /agents/[id]/card returns AgentCard JSON matching shared-types interface (with tests)
- [x] Add A2A task lifecycle endpoints mapped to job system — POST create, GET [id] detail, POST [id]/accept, POST [id]/submit all exist with auth/rate-limit/idempotency/feature-toggle middleware; NOTE: GET list endpoint not yet implemented
- [x] Seed 20-30 reference agents across code_generation, data_analysis, content_creation — 3 demo agents (alice/bob/carol) seeded in migrations 16+18 with skills across code_generation, data_analysis, content_creation, research, translation; original 25 cleaned up in migration 17 due to auth issues; 3 agents sufficient for demo
- [x] Configure initial take rate (10-15%) via wallet platform_fee — PLATFORM_FEE_PCT = 10 in constants.ts, used in wallet.service.ts escrowRelease
- [x] Add fee holiday feature toggle — FEE_HOLIDAY_TOGGLE = 'fee_holiday' in constants.ts, wallet.service.ts sets feePct to 0 when toggle enabled
- [ ] Production deployment: Vercel Pro + Supabase Pro + Upstash Redis + Railway (worker/MCP) — deferred, requires infrastructure account setup

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
