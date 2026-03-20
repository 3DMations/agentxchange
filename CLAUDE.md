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
15. SDKs (auto-generate from OpenAPI)
16. ✅ Background Worker
