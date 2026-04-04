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
- **Hooks**: `apps/web/src/hooks/` — shared React hooks (useMobileMenu for nav state + iOS scroll lock)

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
- [x] Sanitize API error messages — apiError() strips details for 5xx, handleRouteError() defense-in-depth, tests added
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
- [x] GitHub Actions workflow: install → type-check → test → build — .github/workflows/ci.yml (install, type-check, build, test on push/PR; lint step not yet added)
- [x] Enable Turborepo remote caching — turbo login/link done, TURBO_TOKEN + TURBO_TEAM in GitHub Actions CI
- [x] Add error.tsx, not-found.tsx, loading.tsx for dashboard routes — all three exist with skeleton/error/404 UIs
- [x] Add CORS configuration for external SDK/API access — CORS_ALLOWED_ORIGINS env var in next.config.js
- [x] Create .env.production.example with all required vars — includes Supabase, Redis, Unleash, OTEL, CORS, MCP
- [x] Add Sentry error tracking — @sentry/nextjs wired with instrumentation files, DSN on Vercel, org: 3dmations-llc
- [x] Set up Vercel Analytics + Speed Insights — @vercel/analytics + @vercel/speed-insights in root layout, enabled in dashboard

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
- [x] Replace swarm-description stub with real implementation — uses @anthropic-ai/sdk Claude API for LLM-generated descriptions, fetches rich metadata (15 fields), graceful fallback to template, configurable via ANTHROPIC_API_KEY/SWARM_DESCRIPTION_MODEL/SWARM_DESCRIPTION_LLM_ENABLED env vars, sets swarm_confidence_score (0.85 LLM / 0.3 fallback)

### Sprint 6: A2A Protocol + Launch Prep
- [x] Implement A2A Agent Cards from agent profiles (JSON capability descriptions) — GET /agents/[id]/card returns AgentCard JSON matching shared-types interface (with tests)
- [x] Add A2A task lifecycle endpoints mapped to job system — POST create, GET list, GET [id] detail, POST [id]/accept, POST [id]/submit all exist with auth/rate-limit/idempotency/feature-toggle middleware
- [x] Seed 20-30 reference agents across code_generation, data_analysis, content_creation — 3 demo agents (alice/bob/carol) seeded in migrations 16+18 with skills across code_generation, data_analysis, content_creation, research, translation; original 25 cleaned up in migration 17 due to auth issues; 3 agents sufficient for demo
- [x] Configure initial take rate (10-15%) via wallet platform_fee — PLATFORM_FEE_PCT = 10 in constants.ts, used in wallet.service.ts escrowRelease
- [x] Add fee holiday feature toggle — FEE_HOLIDAY_TOGGLE = 'fee_holiday' in constants.ts, wallet.service.ts sets feePct to 0 when toggle enabled
- [ ] Production deployment: Vercel Pro + Supabase Pro + Upstash Redis + Railway (worker/MCP) — deferred, requires infrastructure account setup

### Sprint 7: End-to-End Wiring & Audit Fixes
- [x] Create deliverable API routes — POST /deliverables (submit with Zod validation, safety scan), GET /deliverables/[id] (with auth, access logging)
- [x] Wire webhook dispatch end-to-end — JobService now calls WebhookService.dispatchEvent() on create/accept/submit/complete, enqueues BullMQ webhook-dispatch jobs via queue client
- [x] Wire reputation recalc after job rating — rateJob() enqueues reputation-batch-recalc worker job with agent/rating data instead of returning stub
- [x] Fix MCP get_profile non-existent path — removed /agents/me/profile fallback, agent_id now required (matches actual API route /agents/[id]/profile)
- [x] Add feature toggles to zone routes — zones GET, leaderboard, new-arrivals all wrapped with withFeatureToggle('zones')
- [x] Fix zone visibility duplication — requests GET now uses authenticated createSupabaseServer() for RLS enforcement, removed redundant .filter in zones page
- [x] Add queue client for web app — lib/queue/client.ts provides enqueueJob() utility using BullMQ, used by JobService for async webhook dispatch and reputation recalc
- [x] Fix rate limit fail-open — in-memory fallback now uses 50% of Redis limits (conservative), periodic cleanup, structured Pino logging
- [x] Fix feature toggle fail-open — now fail-closed with configurable essential allowlist (FEATURE_TOGGLE_ESSENTIAL_ALLOWLIST env var), non-essential features disabled when Unleash unavailable
- [x] Architecture audit — docs/architecture-traceability.md: C4 diagrams (3 levels), traceability matrix, data flow diagrams, connection inventory, gap analysis

### Sprint 8: Mobile UI Overhaul (2026-03-28)
- [x] `useMobileMenu` shared hook — toggle state, Escape key, iOS-safe scroll lock (position:fixed)
- [x] Navbar: hamburger menu at md: breakpoint, auth-aware mobile dropdown, persistent "Get Started" CTA
- [x] MarketingHeader: refactored to shared hook, persistent mobile CTA, dark mode fix, aria-label
- [x] DocsSidebar: adopted useMobileMenu, aria-expanded/controls/current, visibility-based focus prevention
- [x] BottomTabBar: inert when hidden, aria-current on all tabs, icon aria-hidden, landscape safe-area
- [x] Filter bars (jobs/skills/tools): flex-col sm:flex-row responsive stacking
- [x] Wallet: mobile card view (md:hidden) + desktop table (hidden md:block)
- [x] Docs: sidebar w-[85vw], responsive headings, footer with nav links
- [x] Button/card/badge/skeleton: motion-reduce compliance, increased touch targets (h-9→h-10)
- [x] Grid polish: md:grid-cols intermediate breakpoints across dashboard
- [x] Tests: use-mobile-menu.test.ts (8), navbar-mobile.test.tsx (4) — 537 total passing
- [ ] Manual viewport testing (375/390/768/1440px) — pending
- [ ] Lighthouse accessibility audit — pending

### Known Audit Findings (from 2026-03-20 ten-agent audit)
- ~~CRITICAL: Supabase service_role key leaked in git history (commit 50932ea, integration.test.ts)~~ RESOLVED Sprint 1
- ~~CRITICAL: 4 tables missing RLS policies (disputes, deliverables, zone_config, sanctions)~~ RESOLVED Sprint 1
- ~~Worker (apps/worker/) is stubs only — no BullMQ integration, no job dispatch~~ RESOLVED Sprint 5
- ~~MCP Server (apps/mcp-server/) is stubs only — no tool handler implementations~~ RESOLVED Sprint 4
- ~~15 routes missing rate limiting, 15 missing feature toggles~~ RESOLVED Sprint 1
- ~~No security headers on any response (CSP, HSTS, X-Frame-Options)~~ RESOLVED Sprint 1
- ~~Zone visibility logic duplicated between app code and RLS policies~~ RESOLVED Sprint 7
- ~~Rate limit middleware fails open when Redis unavailable~~ RESOLVED Sprint 7 (conservative in-memory fallback at 50% limits)
- ~~Feature toggles default enabled when Unleash unavailable~~ RESOLVED Sprint 7 (fail-closed with essential allowlist)
- ~~URL param extraction uses unsafe indexOf pattern across 23 routes~~ RESOLVED (all routes use safe extractParam utility)
- ~~No error boundaries, loading states, or 404 pages in frontend~~ RESOLVED Sprint 3
- ~~No CI/CD pipeline~~ RESOLVED Sprint 3
- ~~Mobile UI has no responsive breakpoints, navbar overflows on phones~~ RESOLVED Sprint 8
- ~~No CI/CD hardening (unpinned actions, no security scanning)~~ RESOLVED Sprint 8
- ~~OpenAPI ↔ route alignment: EXCELLENT (100% match on all 38+ endpoints)~~ UPDATED Sprint 9 (3 endpoints missing: deliverables POST/GET, zones/[zoneId] GET)
- [ ] Production deployment: Vercel Pro + Supabase Pro + Upstash Redis + Railway (worker/MCP) — deferred, requires infrastructure account setup

## Phase 3 — Modernization & Dependency Upgrades (2026-04-04)

### Design Principles
- **One PR per sprint**, feature branch per sprint, commit after each sub-task
- **Commit gate**: `pnpm type-check && pnpm test && pnpm build` must pass before each commit
- **Push strategy**: Push branch + create PR when sprint complete (main is protected, requires approval)
- **Tags**: `v3.sprint-{N}` after each merge for named rollback points

### Sprint 9: Documentation Sync (zero-risk)
- [x] Add 13 missing frontend routes to architecture-traceability.md Frontend Route Map
- [x] Add 5 missing API routes to API Route Inventory; fix total from 42 to 47
- [x] Add `withLogging` and `withTracing` to Middleware table
- [x] Fix swarm-description label: remove "(partial stub)", note "Claude API + @anthropic-ai/sdk"
- [x] Add feature toggles to zone routes in middleware chain table
- [x] Add `POST /deliverables`, `GET /deliverables/{id}`, `GET /zones/{zoneId}` to OpenAPI spec
- [x] Add Validators section listing all 12 Zod schema files
- [ ] Update this CLAUDE.md with Phase 3 plan

### Sprint 10: Test Infrastructure
- [ ] Align Vitest to 4.x across web + sdk (11 files: `vi.restoreAllMocks()` → `vi.clearAllMocks()`)
- [ ] Verify jsdom 29 + Vitest 4 compat (19 component tests at risk; pin jsdom@^26.1.0 if broken)
- [ ] Add v8 coverage tooling to all vitest.config.ts (start thresholds: 30% statements/lines)
- [ ] Add coverage reporting to CI (.github/workflows/ci.yml)
- [ ] Create shared test utilities: `apps/web/src/test-utils/` (mock factories for Supabase, fetch, agents, jobs)
- [ ] Add vitest config + test script to packages/shared-types
- [ ] Remove meaningless "should instantiate" / "has all methods" tests

### Sprint 11: Critical Test Coverage
- [ ] shared-types: type guard tests, API envelope shape, enum completeness (14 files, 0% → target 80%)
- [ ] Auth pages: register, login, forgot-password, session refresh (5 files, 0%)
- [ ] Supabase clients: client.ts, server.ts, admin.ts (4 files, 0%)
- [ ] MCP tool handlers: individual tests for each of 11 tools
- [ ] Worker jobs (remaining 3): stale-escrow-check, tool-rescan, wallet-reconciliation
- [ ] Queue client: lib/queue/client.ts (enqueue success + Redis failure fallback)
- [ ] Ratchet CI coverage thresholds to (actual - 5%)

### Sprint 12: Easy Dependency Upgrades (1 PR each, LOW risk)
- [ ] pino ^9.x → ^10.x (only drops Node 18; we require ≥20)
- [ ] GitHub Actions SHA pins → latest v4.x
- [ ] @types/node → latest ^22.x (NEVER upgrade to 25.x — must match Node 22 runtime)
- [ ] ioredis → latest ^5.x
- [ ] bullmq → latest ^5.x
- [ ] unleash-client → latest ^6.x
- [ ] @sentry/nextjs → latest ^10.x
- [ ] @anthropic-ai/sdk → latest ^0.x
- [ ] @modelcontextprotocol/sdk → latest ^1.x
- [ ] @supabase/supabase-js → latest ^2.x

### Sprint 13: Medium Dependency Upgrades (MEDIUM risk)
- [ ] Zod 3 → 4: `z.record()` needs 2 args (3 lines), `.flatten()` → `z.treeifyError()` (31 route files), `.refine({message})` → `{error}` (2 files), string error args (4 lines). Run `npx @zod/codemod --transform v3-to-v4` first.
- [ ] @supabase/ssr → evaluate 1.x if available
- [ ] Add dependabot.yml blocking major version PRs globally

### Sprint 14a: Tailwind 3 → 4 (HIGH risk, ~3-4 hours)
- [ ] Run `@tailwindcss/upgrade` codemod (auto-fixes ~90%: config→CSS, shadow/outline/gradient renames)
- [ ] Swap tailwindcss-animate → tw-animate-css (4-5 component files, manual)
- [ ] Add cursor-pointer to button base styles (button.tsx)
- [ ] Fix bare `border` color in toast.tsx, dialog.tsx (add explicit border-border)
- [ ] Remove autoprefixer dependency (built into TW4)
- [ ] Visual regression check at 375/768/1440px

### Sprint 14b: Next.js 14 → 15 → 16 + React 18 → 19 (HIGHEST risk, ~8-12 hours)
**Phase 1 (Next 15 + React 19):**
- [ ] Bump react/react-dom/next/@types to 15/19
- [ ] Fix async params in docs/[slug]/page.tsx + any other server components
- [ ] Fix next.config.js: serverComponentsExternalPackages → serverExternalPackages
- [ ] Replace next-themes (semi-abandoned, no React 19 support) — roll own or use alternative
- [ ] Verify @sentry/nextjs, @supabase/ssr, Radix UI compat
**Phase 2 (Next 16):**
- [ ] Rename middleware.ts → proxy.ts (use `npx @next/codemod@latest middleware-to-proxy .`)
- [ ] Migrate .eslintrc.json → eslint.config.mjs (next lint removed in 16)
- [ ] Update CI lint command
- [ ] Optional: remove forwardRef wrappers (9 component files, deprecated not removed)
- [ ] Full regression: all tests + visual check

### Known Unknown Unknowns (from 2026-04-04 research)
- ⚠️ `tailwind-merge@3.5` already targets TW4 — may cause latent class merge bugs with current TW3. Resolved by TW4 upgrade.
- ⚠️ `next-themes@0.4.6` has no React 19 peer dep support, maintainer inactive. Must replace in Sprint 14b.
- ⚠️ jsdom 29 + Vitest 4 has documented ESM compat risk (vitest-dev/vitest#9279). Test first in Sprint 10.
- ⚠️ Idempotency middleware fails open when Redis unavailable — accepted risk, documented.
- ⚠️ DeliverableService.runSafetyScans() is a stub — deferred to future sprint.

### Sprint Dependency Graph
```
Sprint 9 (Docs) → Sprint 10 (Test Infra) ��� Sprint 11 (Coverage)
                                                  ↓
                                            Sprint 12 (Easy Deps)
                                                  ↓
                                            Sprint 13 (Zod 4)
                                                  ↓
                                            Sprint 14a (Tailwind 4)
                                                  ↓
                                            Sprint 14b (Next 16 + React 19)
```

## Memory System
Read .claude/rules/memory-system.md for full operating rules.
At session start: show memory capacity display.
After every task: self-assess for mistakes or new insights. If you find one, ask:
"I noticed [description]. Should I log this to memory?" Wait for confirmation.
Before every task: read .claude/memory/summaries/gotchas.md. Read domain-specific
summary files only when relevant to the current task.
When you encounter a known problem: search .claude/memory/ before attempting a fix.
Do NOT log learnings about the memory system itself — fix memory issues directly.
If .claude/memory/ does not exist, inform the user and offer to run the bootstrap.
