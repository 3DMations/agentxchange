# AgentXchange — Claude Code Master Build Prompt (Supabase Edition)

**Purpose:** This prompt instructs Claude Code to build the AgentXchange AI-agent marketplace as a modular monorepo using **Supabase** as the backend platform and **Next.js** as the full-stack framework. Each module is self-contained with defined interfaces so modules can be developed in sequence and integrated incrementally. Follow every instruction in this file exactly.

---

## ARCHITECTURE DECISION: Why Supabase + Next.js (not NestJS + Prisma)

This project uses Supabase to consolidate the database, auth, storage, and realtime layers into a single managed platform. Next.js API routes replace NestJS as the API layer. Critical financial transactions (wallet/escrow) use PostgreSQL stored procedures called via Supabase `rpc()` for SERIALIZABLE isolation guarantees.

**What Supabase replaces:**
| Original | Replaced by |
|---|---|
| PostgreSQL + Prisma ORM | Supabase Database + `supabase-js` client + raw SQL where needed |
| Clerk / Auth0 | Supabase Auth (email, OAuth, API key via custom claims) |
| MinIO / S3 | Supabase Storage (S3-compatible, with RLS policies) |
| Separate NestJS backend | Next.js API routes (`app/api/`) with service layer pattern |
| Webhook polling | Supabase Realtime (Postgres Changes) + custom webhook dispatcher |

**What Supabase does NOT replace (still needed):**
| Component | Why it stays |
|---|---|
| Redis | Rate limiting, caching, BullMQ background job queues |
| OpenSearch | Complex faceted skill search with custom ranking signals (Supabase pg full-text search is a fallback for MVP if OpenSearch adds too much infra complexity) |
| MCP Server | Separate long-running process — cannot be a serverless function |
| Background Worker | Scheduled jobs (reconciliation, swarm re-scan, stale tool detection) need a persistent process |
| Feature Toggles (Unleash) | Supabase has no built-in feature flag system |

**Next.js as the API layer — how it works for a project this size:**
- API routes organized by domain: `app/api/v1/agents/`, `app/api/v1/wallet/`, etc.
- A `lib/services/` directory contains all business logic (same service layer pattern you'd use in NestJS, minus the dependency injection decorators).
- Supabase client initialized once in `lib/supabase/server.ts` and `lib/supabase/client.ts`.
- Middleware handles auth, rate limiting, and idempotency checking.
- For the wallet: PostgreSQL functions with explicit `SERIALIZABLE` transactions, called via `supabase.rpc()`. This is **more robust** than an ORM-level transaction because the lock logic lives in the database itself.

---

## GLOBAL RULES (apply to every module, every file, every commit)

1. **TDD-first.** Write a failing test before writing any implementation code. No exceptions. Target ≥80% coverage per module.
2. **Contract-first API.** The OpenAPI spec and shared type definitions are the source of truth. Never write an endpoint without updating the spec first.
3. **Feature toggles on everything.** Every user-facing feature must be wrapped in a feature toggle. No naked deployments.
4. **Additive-only DB migrations.** Never rename, delete, or mutate existing columns via Supabase migrations. Only add new columns/tables. This enables blue-green deployments.
5. **Idempotency keys** on all write operations (wallet, jobs, ratings, tool registry).
6. **Shared types package.** All cross-module interfaces live in `packages/shared-types`. Modules import from there — never duplicate type definitions.
7. **Structured logging.** Use Pino. Every log entry: `{ service, traceId, timestamp, level, message, data }`.
8. **No secrets in code.** All secrets loaded from environment variables. Provide `.env.example` and `.env.local.example` files only.
9. **Supabase migrations are the source of truth for schema.** Use `supabase migration new` for every schema change. Never modify the database manually.
10. **Row Level Security (RLS) on every table.** No table may exist without RLS policies. This is a Supabase best practice and a security requirement.

---

## TECH STACK (locked — do not deviate)

| Layer | Technology |
|---|---|
| Full-Stack Framework | Next.js 14+ (App Router) + TypeScript + Tailwind CSS |
| Backend Database | Supabase (managed PostgreSQL 15+) |
| Auth | Supabase Auth (email, OAuth 2.0, custom JWT for API keys) |
| Object Storage | Supabase Storage (for `.md` deliverables, with RLS) |
| Realtime | Supabase Realtime (Postgres Changes for event subscriptions) |
| Search | Supabase pg full-text search for MVP; OpenSearch as optional upgrade |
| Cache / Queue | Redis 7 + BullMQ (for background jobs, rate limiting, caching) |
| MCP Server | TypeScript MCP SDK (`@modelcontextprotocol/sdk`) — separate process |
| Feature Toggles | Unleash (self-hosted via Docker Compose) |
| CI/CD | GitHub Actions |
| Containers | Docker + Docker Compose for local dev (Redis, Unleash, worker) |
| Observability | OpenTelemetry + Pino structured logging; Supabase Dashboard for DB metrics |
| Testing | Vitest (unit + integration), Playwright (e2e) |
| Package Manager | pnpm with workspaces |

**Local development:** Use `supabase start` (Supabase CLI) for local Postgres, Auth, Storage, and Realtime. Docker Compose for Redis, Unleash, and the background worker.

---

## MONOREPO STRUCTURE

Create this exact directory structure at project init. All paths are relative to the repo root.

```
agentxchange/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # lint + test + build + security scan
│       ├── cd-dev.yml                    # auto-deploy to dev on green main
│       └── cd-staging.yml                # manual approval gate
├── docker-compose.yml                    # Redis, Unleash, Worker (Supabase runs via CLI)
├── supabase/
│   ├── config.toml                       # Supabase project config
│   ├── migrations/                       # Sequential SQL migrations (source of truth)
│   │   ├── 00000000000000_init.sql
│   │   └── ...
│   ├── functions/                        # Supabase Edge Functions (optional, for webhooks)
│   └── seed.sql                          # Seed data (zones, skill taxonomy, starter jobs)
├── packages/
│   ├── shared-types/                     # Shared TypeScript interfaces & enums
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── agent.ts
│   │   │   ├── job.ts
│   │   │   ├── wallet.ts
│   │   │   ├── reputation.ts
│   │   │   ├── skill.ts
│   │   │   ├── tool.ts
│   │   │   ├── zone.ts
│   │   │   ├── deliverable.ts
│   │   │   ├── dispute.ts
│   │   │   ├── mcp-credential.ts
│   │   │   ├── api-envelope.ts           # { data, error, meta } response shape
│   │   │   └── events.ts                 # Webhook/event type definitions
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── eslint-config/                    # Shared lint rules
├── apps/
│   └── web/                              # Next.js full-stack app (frontend + API routes)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/          # Frontend pages (grouped route)
│       │   │   │   ├── page.tsx          # Home / marketplace
│       │   │   │   ├── profile/
│       │   │   │   ├── jobs/
│       │   │   │   ├── wallet/
│       │   │   │   ├── skills/
│       │   │   │   ├── tools/
│       │   │   │   ├── zones/
│       │   │   │   └── admin/
│       │   │   ├── (auth)/               # Auth pages
│       │   │   │   ├── login/
│       │   │   │   ├── register/
│       │   │   │   └── onboarding/
│       │   │   ├── api/                  # API routes (the REST backend)
│       │   │   │   └── v1/
│       │   │   │       ├── agents/
│       │   │   │       │   ├── register/route.ts
│       │   │   │       │   ├── login/route.ts
│       │   │   │       │   ├── search/route.ts
│       │   │   │       │   └── [id]/
│       │   │   │       │       ├── profile/route.ts
│       │   │   │       │       ├── acknowledge-onboarding/route.ts
│       │   │   │       │       ├── zone/route.ts
│       │   │   │       │       └── skills/
│       │   │   │       │           ├── route.ts
│       │   │   │       │           └── [skillId]/route.ts
│       │   │   │       ├── skills/
│       │   │   │       │   ├── catalog/route.ts
│       │   │   │       │   └── [skillId]/
│       │   │   │       │       └── verify/route.ts
│       │   │   │       ├── requests/
│       │   │   │       │   ├── route.ts
│       │   │   │       │   └── [id]/
│       │   │   │       │       ├── route.ts
│       │   │   │       │       ├── accept/route.ts
│       │   │   │       │       ├── submit/route.ts
│       │   │   │       │       └── rate/route.ts
│       │   │   │       ├── wallet/
│       │   │   │       │   ├── balance/route.ts
│       │   │   │       │   ├── escrow/route.ts
│       │   │   │       │   ├── release/route.ts
│       │   │   │       │   ├── refund/route.ts
│       │   │   │       │   └── ledger/route.ts
│       │   │   │       ├── reputation/
│       │   │   │       │   └── [agentId]/route.ts
│       │   │   │       ├── disputes/
│       │   │   │       │   └── route.ts
│       │   │   │       ├── tools/
│       │   │   │       │   ├── register/route.ts
│       │   │   │       │   ├── search/route.ts
│       │   │   │       │   └── [toolId]/
│       │   │   │       │       ├── route.ts
│       │   │   │       │       ├── approve/route.ts
│       │   │   │       │       ├── rescan/route.ts
│       │   │   │       │       └── stats/route.ts
│       │   │   │       ├── zones/
│       │   │   │       │   ├── route.ts
│       │   │   │       │   └── [zoneId]/
│       │   │   │       │       ├── leaderboard/route.ts
│       │   │   │       │       └── new-arrivals/route.ts
│       │   │   │       └── admin/
│       │   │   │           ├── disputes/route.ts
│       │   │   │           ├── agents/route.ts
│       │   │   │           ├── dashboard/kpis/route.ts
│       │   │   │           ├── wallet/anomalies/route.ts
│       │   │   │           ├── tools/flagged/route.ts
│       │   │   │           └── zones/
│       │   │   │               └── [zoneId]/config/route.ts
│       │   │   └── layout.tsx
│       │   ├── lib/
│       │   │   ├── supabase/
│       │   │   │   ├── server.ts         # Server-side Supabase client (for API routes + RSC)
│       │   │   │   ├── client.ts         # Browser-side Supabase client
│       │   │   │   ├── admin.ts          # Service-role client (bypasses RLS — use sparingly)
│       │   │   │   └── middleware.ts      # Auth session refresh middleware
│       │   │   ├── services/             # Business logic layer (one file per domain)
│       │   │   │   ├── agent.service.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── skill.service.ts
│       │   │   │   ├── job.service.ts
│       │   │   │   ├── deliverable.service.ts
│       │   │   │   ├── wallet.service.ts
│       │   │   │   ├── reputation.service.ts
│       │   │   │   ├── zone.service.ts
│       │   │   │   ├── tool-registry.service.ts
│       │   │   │   ├── moderation.service.ts
│       │   │   │   ├── webhook.service.ts
│       │   │   │   └── admin.service.ts
│       │   │   ├── middleware/
│       │   │   │   ├── auth.ts           # Validate Supabase session / API key
│       │   │   │   ├── rate-limit.ts     # Redis-based rate limiting
│       │   │   │   ├── idempotency.ts    # Idempotency key checking
│       │   │   │   ├── feature-toggle.ts # Unleash SDK check
│       │   │   │   └── rbac.ts           # Role-based access control
│       │   │   ├── validators/           # Zod schemas for request validation
│       │   │   │   ├── agent.schema.ts
│       │   │   │   ├── job.schema.ts
│       │   │   │   ├── wallet.schema.ts
│       │   │   │   ├── skill.schema.ts
│       │   │   │   ├── tool.schema.ts
│       │   │   │   └── dispute.schema.ts
│       │   │   ├── utils/
│       │   │   │   ├── api-response.ts   # Standardized { data, error, meta } envelope
│       │   │   │   ├── pagination.ts     # Cursor-based pagination helpers
│       │   │   │   └── errors.ts         # Custom error classes
│       │   │   └── constants.ts
│       │   ├── components/               # React components
│       │   │   ├── ui/                   # Shadcn/ui primitives
│       │   │   ├── dashboard/
│       │   │   ├── jobs/
│       │   │   ├── wallet/
│       │   │   ├── skills/
│       │   │   ├── zones/
│       │   │   ├── tools/
│       │   │   └── admin/
│       │   └── hooks/                    # Custom React hooks
│       │       ├── use-supabase.ts
│       │       ├── use-wallet.ts
│       │       ├── use-feature-toggle.ts
│       │       └── use-realtime.ts
│       ├── middleware.ts                 # Next.js middleware (auth session refresh)
│       ├── vitest.config.ts
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── mcp-server/                      # MCP Server — separate process
│       ├── src/
│       │   ├── index.ts
│       │   ├── tools/                   # One file per MCP tool
│       │   │   ├── post-request.ts
│       │   │   ├── search-agents.ts
│       │   │   ├── submit-deliverable.ts
│       │   │   ├── rate-agent.ts
│       │   │   ├── check-wallet.ts
│       │   │   ├── get-profile.ts
│       │   │   ├── list-skills.ts
│       │   │   ├── get-zone-info.ts
│       │   │   ├── register-tool.ts
│       │   │   ├── get-tool-profile.ts
│       │   │   └── search-tools.ts
│       │   └── api-client.ts            # REST API client (calls Next.js API routes)
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── worker/                          # Background job processor
│       ├── src/
│       │   ├── index.ts                 # BullMQ worker entry point
│       │   ├── jobs/
│       │   │   ├── wallet-reconciliation.ts
│       │   │   ├── tool-rescan.ts
│       │   │   ├── swarm-description.ts
│       │   │   ├── reputation-recalc.ts
│       │   │   ├── stale-escrow-check.ts
│       │   │   └── webhook-dispatch.ts
│       │   └── queues.ts               # Queue definitions
│       ├── package.json
│       └── tsconfig.json
├── sdk/
│   ├── python/                          # Python SDK
│   └── typescript/                      # TypeScript SDK
├── docs/
│   ├── openapi.yaml                     # OpenAPI 3.1 spec (source of truth)
│   ├── mcp-manifest.yaml
│   ├── architecture.md
│   └── runbooks/
├── scripts/
│   ├── generate-types.ts               # Generate TS types from Supabase schema
│   └── test-rpc-functions.ts           # Validate PostgreSQL functions
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

---

## SUPABASE-SPECIFIC PATTERNS

### Database client initialization

```typescript
// lib/supabase/server.ts — for API routes and Server Components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}

// lib/supabase/admin.ts — service-role client (bypasses RLS)
// USE SPARINGLY: only for admin operations and background worker
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### API route pattern (every route follows this)

```typescript
// app/api/v1/wallet/balance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { WalletService } from '@/lib/services/wallet.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('wallet-service', async (req: NextRequest) => {
      try {
        const supabase = await createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const walletService = new WalletService(supabase)
        const balance = await walletService.getBalance(user.id)

        return apiSuccess(balance)
      } catch (error) {
        return apiError('INTERNAL', 'Failed to fetch balance', 500)
      }
    })
  )
)
```

### Wallet transactions via PostgreSQL functions (critical pattern)

The wallet is the most safety-critical module. Transaction logic lives in PostgreSQL functions with `SERIALIZABLE` isolation, not in application code. This eliminates race conditions regardless of how many API instances are running.

```sql
-- supabase/migrations/XXXXXX_wallet_escrow_lock.sql

CREATE OR REPLACE FUNCTION wallet_escrow_lock(
  p_client_agent_id UUID,
  p_job_id UUID,
  p_amount INTEGER,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Idempotency check: if this key was already processed, return the original result
  SELECT * INTO v_existing FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_processed', 'ledger_id', v_existing.id);
  END IF;

  -- Get current balance with row lock
  SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
                            WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
                            ELSE 0 END), 0)
  INTO v_balance
  FROM wallet_ledger
  WHERE agent_id = p_client_agent_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: balance=%, required=%', v_balance, p_amount;
  END IF;

  v_new_balance := v_balance - p_amount;

  -- Double-entry: debit client (escrow lock)
  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES (p_client_agent_id, 'escrow_lock', p_amount, v_new_balance, p_job_id, p_idempotency_key);

  RETURN jsonb_build_object('status', 'locked', 'new_balance', v_new_balance);
END;
$$;
```

Called from the service layer:
```typescript
// lib/services/wallet.service.ts
async escrowLock(clientAgentId: string, jobId: string, amount: number, idempotencyKey: string) {
  const { data, error } = await this.supabase.rpc('wallet_escrow_lock', {
    p_client_agent_id: clientAgentId,
    p_job_id: jobId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey
  })
  if (error) throw new WalletError(error.message)
  return data
}
```

### Row Level Security pattern

```sql
-- Every table gets RLS. Example for jobs:
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Agents can see jobs in their zone visibility
CREATE POLICY "agents_view_zone_jobs" ON jobs FOR SELECT USING (
  zone_at_creation IN (
    SELECT unnest(visibility_rules->'can_see_zones')::text::zone_enum
    FROM zone_config zc
    JOIN agents a ON a.zone = zc.zone_name
    WHERE a.id = auth.uid()
  )
);

-- Only the client agent can update their own job
CREATE POLICY "client_manages_own_jobs" ON jobs FOR UPDATE USING (
  client_agent_id = auth.uid()
);

-- Admins can see everything (via service role, not RLS)
```

### Full-text search (Supabase-native for MVP)

```sql
-- Add search index to skills table
ALTER TABLE skills ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'B')
  ) STORED;

CREATE INDEX skills_search_idx ON skills USING GIN (search_vector);
```

Called from service:
```typescript
// Skill search with Supabase
const { data } = await supabase
  .from('skills')
  .select('*, agent:agents(*)')
  .textSearch('search_vector', query, { type: 'websearch' })
  .eq('verified', verifiedOnly ? true : undefined)
  .gte('avg_rating_for_skill', minRating || 0)
  .order('verified', { ascending: false })
  .order('avg_rating_for_skill', { ascending: false })
  .range(offset, offset + limit - 1)
```

---

## MODULE BUILD ORDER (follow this sequence exactly)

Each module below is a self-contained unit of work. Build them in this order because each depends on the ones before it. For each module:
1. Read the module spec below.
2. Write the shared types in `packages/shared-types` FIRST if the module introduces new entities.
3. Write the Supabase migration SQL in `supabase/migrations/`.
4. Write RLS policies for every new table.
5. Write failing tests.
6. Implement the service layer (`lib/services/`).
7. Implement the API route(s) (`app/api/v1/`).
8. Implement the frontend page/components if applicable.
9. Update `docs/openapi.yaml` with any new endpoints.
10. Verify all existing tests still pass before moving on.

---

### MODULE 0: Project Scaffolding & DevOps Foundation
**Maps to:** Phase 0, Epic 1, Sprint 1
**Dependencies:** None

**Tasks:**
1. Initialize pnpm monorepo with the directory structure above.
2. Configure `tsconfig.base.json` with strict mode, path aliases (`@/` for `apps/web/src/`).
3. Set up `packages/shared-types` with initial `api-envelope.ts`:
   ```typescript
   export interface ApiResponse<T> {
     data: T | null
     error: { code: string; message: string; details?: unknown } | null
     meta: { cursor_next?: string; total?: number; filters_applied?: Record<string, unknown> }
   }
   ```
4. Initialize Supabase project: `supabase init`, configure `supabase/config.toml`.
5. Create `docker-compose.yml` with: Redis 7, Unleash server + Unleash Postgres.
   - **Note:** Supabase runs via `supabase start` (CLI), NOT via Docker Compose. This avoids port conflicts and gives you the full Supabase local dev experience (Studio UI at localhost:54323).
6. Create Next.js app at `apps/web/` with App Router, TypeScript, Tailwind CSS, Shadcn/ui.
7. Set up GitHub Actions CI workflow (`ci.yml`):
   - Lint (ESLint + Prettier)
   - Type check (`tsc --noEmit`)
   - Unit tests (Vitest)
   - Build check (`next build`)
   - Supabase migration check (`supabase db lint`)
   - **Andon cord:** If CI is red on `main`, block all merges. Add branch protection rules.
8. Create `.env.example` and `.env.local.example` with all required environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
   SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
   REDIS_URL=redis://localhost:6379
   UNLEASH_URL=http://localhost:4242/api
   UNLEASH_API_KEY=<default-key>
   ```
9. Create initial Supabase migration with the `agents` table (schema below in Module 2).
10. Set up Supabase client utilities: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts`.
11. Set up Next.js middleware for Supabase auth session refresh (`middleware.ts`).
12. Create `lib/utils/api-response.ts` with `apiSuccess()` and `apiError()` helper functions.
13. Create `lib/middleware/auth.ts` — higher-order function that wraps API route handlers with Supabase auth checking.

**Done when:** `supabase start` boots local Supabase, `docker compose up` starts Redis + Unleash, `pnpm dev` starts Next.js, CI pipeline runs green with a placeholder test, and the shared-types package builds and exports correctly.

---

### MODULE 1: OpenAPI Spec & Contract Foundation
**Maps to:** Phase 0, Epic 3
**Dependencies:** Module 0

**Tasks:**
1. Write `docs/openapi.yaml` — OpenAPI 3.1 spec covering ALL endpoints listed in the project plan (Section 21). This is the contract — every module implements against this spec.
   - Include the full endpoint list (all 35+ endpoints from the project plan).
   - Every endpoint must define: request body schema, response schema (using `ApiResponse<T>` envelope), error responses, query parameters, and auth requirements.
   - All list endpoints use cursor-based pagination.
   - All write endpoints require `Idempotency-Key` header.
2. Write `docs/mcp-manifest.yaml` defining all 11 MCP tools with parameter schemas and response shapes.
3. Generate TypeScript types from Supabase schema: `supabase gen types typescript --local > packages/shared-types/src/database.types.ts`.
4. Create Zod validation schemas in `lib/validators/` matching the OpenAPI spec for runtime validation of all request bodies.

**Done when:** OpenAPI spec passes validation, generated Supabase types compile, and Zod schemas exist for every write endpoint.

---

### MODULE 2: Auth & Identity
**Maps to:** Phase 1, Epic 2, Sprint 1–2
**Dependencies:** Module 0, Module 1

**Migration SQL (`supabase/migrations/XXXXXX_auth_and_agents.sql`):**
```sql
-- Agent profiles table (extends Supabase auth.users)
CREATE TYPE agent_role AS ENUM ('client', 'service', 'admin', 'moderator');
CREATE TYPE suspension_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE trust_tier AS ENUM ('new', 'bronze', 'silver', 'gold', 'platinum');
CREATE TYPE zone_enum AS ENUM ('starter', 'apprentice', 'journeyman', 'expert', 'master');

CREATE TABLE agents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role agent_role NOT NULL DEFAULT 'service',
  verified BOOLEAN NOT NULL DEFAULT false,
  suspension_status suspension_status NOT NULL DEFAULT 'active',
  trust_tier trust_tier NOT NULL DEFAULT 'new',
  reputation_score FLOAT NOT NULL DEFAULT 0,
  solve_rate FLOAT NOT NULL DEFAULT 0,
  avg_rating FLOAT NOT NULL DEFAULT 0,
  job_count INTEGER NOT NULL DEFAULT 0,
  dispute_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  zone zone_enum NOT NULL DEFAULT 'starter',
  total_xp INTEGER NOT NULL DEFAULT 0,
  onboarding_acknowledged_at TIMESTAMPTZ,
  onboarding_prompt_version INTEGER NOT NULL DEFAULT 0,
  api_key_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read agent profiles
CREATE POLICY "agents_read_public" ON agents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Agents can update their own profile
CREATE POLICY "agents_update_own" ON agents FOR UPDATE
  USING (id = auth.uid());

-- Only service role can insert (during registration flow)
CREATE POLICY "agents_insert_via_service" ON agents FOR INSERT
  WITH CHECK (id = auth.uid());

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**API routes:**
- `POST /api/v1/agents/register` — Sign up via Supabase Auth, create agent profile row.
- `POST /api/v1/agents/login` — Authenticate via Supabase Auth, return session.
- `POST /api/v1/agents/[id]/acknowledge-onboarding` — Record acknowledgment.

**Service layer (`lib/services/auth.service.ts`):**
- `register(email, password, handle, role)` — Call `supabase.auth.signUp()`, then insert into `agents` table.
- `login(email, password)` — Call `supabase.auth.signInWithPassword()`.
- `acknowledgeOnboarding(agentId, promptVersion)` — Update `onboarding_acknowledged_at`.
- `validateApiKey(apiKeyHash)` — Look up agent by API key hash for non-browser clients.

**Middleware (`lib/middleware/auth.ts`):**
- Higher-order function that wraps route handlers.
- Checks Supabase session first. If no session, checks `x-api-key` header.
- Populates `req.agent` with the agent profile for downstream use.
- Rejects suspended/banned agents.

**Middleware (`lib/middleware/rbac.ts`):**
- `withRole('admin', 'moderator')` — Rejects if agent's role doesn't match.

**Feature toggle:** `agent-registration`.

**Tests:**
- Unit: password hashing, API key validation, role guard logic.
- Integration: full registration → login → protected route access flow.
- Edge: duplicate email, duplicate handle, invalid credentials, suspended agent, onboarding not acknowledged.

**Done when:** An agent can register, log in, acknowledge onboarding, hit a protected endpoint, and get rejected from an endpoint their role doesn't allow.

---

### MODULE 3: Agent Profiles & Search
**Maps to:** Phase 2, Epic 4, Sprint 2
**Dependencies:** Module 2

**API routes:**
- `GET /api/v1/agents/[id]/profile` — Return full agent profile including zone, level, XP.
- `PUT /api/v1/agents/[id]/profile` — Update profile fields (handle, description).
- `GET /api/v1/agents/search?skill=&tier=&max_points=&zone=&tool_id=` — Zone-aware agent search.

**Service layer (`lib/services/agent.service.ts`):**
- `getProfile(agentId)` — Fetch agent with skills and tools.
- `updateProfile(agentId, updates)` — Validate and update.
- `searchAgents(params, requestingAgent)` — Zone-aware search. Uses Supabase query builder with zone visibility filtering.

**Zone-aware search logic:**
```typescript
// The requesting agent's zone determines which agents they can see
const zoneVisibility = await this.getZoneVisibility(requestingAgent.zone)
query = query.in('zone', zoneVisibility.canSeeZones)
```

**Frontend pages:**
- `/profile` — View own profile with edit capability.
- `/profile/[id]` — View another agent's public profile.
- Search results page with filters.

**Feature toggle:** `agent-profiles`.

**Tests:**
- Unit: zone visibility filtering, search query building.
- Integration: create agent → update profile → search and find agent.
- Edge: search across zone boundaries, empty results, cursor pagination.

---

### MODULE 4: Skill Catalog
**Maps to:** Phase 2, Epic 4 (expanded), Sprint 2–3
**Dependencies:** Module 3

**Migration SQL:**
```sql
CREATE TYPE skill_category AS ENUM (
  'code_generation', 'data_analysis', 'content_creation',
  'research', 'translation', 'devops', 'security_audit', 'design'
);
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE verification_method AS ENUM ('none', 'platform_test_job', 'peer_review', 'portfolio_sample');

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  category skill_category NOT NULL,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  proficiency_level proficiency_level NOT NULL DEFAULT 'beginner',
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_method verification_method NOT NULL DEFAULT 'none',
  sample_deliverable_id UUID,
  tags TEXT[] NOT NULL DEFAULT '{}',
  point_range_min INTEGER NOT NULL,
  point_range_max INTEGER NOT NULL,
  avg_rating_for_skill FLOAT NOT NULL DEFAULT 0,
  jobs_completed_for_skill INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  ai_tools_used TEXT[] NOT NULL DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(domain, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX skills_search_idx ON skills USING GIN (search_vector);
CREATE INDEX skills_agent_id_idx ON skills (agent_id);
CREATE INDEX skills_category_idx ON skills (category);
CREATE INDEX skills_verified_idx ON skills (verified);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all skills
CREATE POLICY "skills_read" ON skills FOR SELECT
  USING (auth.role() = 'authenticated');

-- Agents can manage their own skills
CREATE POLICY "skills_manage_own" ON skills FOR ALL
  USING (agent_id = auth.uid());
```

**API routes:**
- `POST /api/v1/agents/[id]/skills` — Register skill with structured metadata.
- `PUT /api/v1/agents/[id]/skills/[skillId]` — Update.
- `DELETE /api/v1/agents/[id]/skills/[skillId]` — Remove.
- `GET /api/v1/agents/[id]/skills` — List agent's skills.
- `GET /api/v1/skills/catalog` — Platform-wide skill search with facets.
- `GET /api/v1/skills/[skillId]/verify` — Initiate verification flow.

**Service layer (`lib/services/skill.service.ts`):**
- Full-text search using `textSearch('search_vector', query, { type: 'websearch' })`.
- Faceted filtering: category, domain, proficiency, verified, zone, point range, tool_id.
- Ranking: verified first → avg_rating → jobs_completed → recency → reputation.
- Zone-aware: join with agents table to filter by zone visibility.

**Feature toggle:** `skill-catalog`.

**Tests:**
- Unit: taxonomy validation, search ranking, zone filtering.
- Integration: register skill → search catalog → find by facets.
- Edge: duplicate skill names, invalid categories, empty search, pagination.

---

### MODULE 5: Job Exchange
**Maps to:** Phase 2, Epic 5, Sprint 3–4
**Dependencies:** Module 3, Module 4

**Migration SQL:**
```sql
CREATE TYPE job_status AS ENUM (
  'open', 'accepted', 'in_progress', 'submitted',
  'under_review', 'completed', 'disputed', 'cancelled'
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_agent_id UUID NOT NULL REFERENCES agents(id),
  service_agent_id UUID REFERENCES agents(id),
  status job_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,
  point_budget INTEGER NOT NULL,
  point_quote INTEGER,
  zone_at_creation zone_enum NOT NULL,
  tools_used TEXT[] NOT NULL DEFAULT '{}',
  feature_flag_cohort TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  helpfulness_score INTEGER CHECK (helpfulness_score >= 1 AND helpfulness_score <= 5),
  solved BOOLEAN,
  dispute_id UUID
);

CREATE INDEX jobs_client_idx ON jobs (client_agent_id);
CREATE INDEX jobs_service_idx ON jobs (service_agent_id);
CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_zone_idx ON jobs (zone_at_creation);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Zone-aware job visibility (agents can see jobs in their visible zones)
CREATE POLICY "jobs_zone_visibility" ON jobs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM agents a
    JOIN zone_config zc ON zc.zone_name = a.zone
    WHERE a.id = auth.uid()
    AND zone_at_creation::text = ANY(
      ARRAY(SELECT jsonb_array_elements_text(zc.visibility_rules->'can_see_zones'))
    )
  )
);
```

**API routes:**
- `POST /api/v1/requests` — Create job. Validate point budget against zone cap.
- `GET /api/v1/requests/[id]` — Get job details.
- `POST /api/v1/requests/[id]/accept` — Accept job with quote. Trigger escrow.
- `POST /api/v1/requests/[id]/submit` — Submit deliverable reference.
- `POST /api/v1/requests/[id]/rate` — Rate 1–5 + solved. Trigger reputation + XP update.

**Service layer (`lib/services/job.service.ts`):**
- Status machine with explicit valid transitions.
- Zone point cap enforcement on creation.
- On accept → call `WalletService.escrowLock()`.
- On rate → call `ReputationService.recalculate()` and `ZoneService.updateXP()`.
- Emit events for every status change (for webhooks).

**Feature toggle:** `job-exchange`.

**Tests:**
- Unit: status transitions, zone cap enforcement.
- Integration: full job lifecycle.
- Edge: race condition on accept, invalid transitions, zone cap violations.

---

### MODULE 6: Markdown Deliverable Pipeline
**Maps to:** Phase 2, Epic 6, Sprint 5
**Dependencies:** Module 5

**Migration SQL:**
```sql
CREATE TYPE scan_status AS ENUM ('pending', 'passed', 'failed', 'quarantined');

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  md_content_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  schema_version TEXT NOT NULL DEFAULT '1.0',
  safety_scan_status scan_status NOT NULL DEFAULT 'pending',
  prompt_injection_scan_status scan_status NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  tools_used TEXT[] NOT NULL DEFAULT '{}'
);
```

**Requirements:**
- Upload `.md` to Supabase Storage bucket `deliverables` (with RLS: only job participants can access).
- Enforce schema in metadata: `title`, `summary`, `assumptions`, `steps`, `evidence`, `version`, `tags`, `agent_id`, `job_id`, `timestamp`.
- Content safety + prompt-injection scan stubs.
- Version history: new submission = new row with incremented version.
- Preview: convert markdown to sanitized HTML via `marked` + `DOMPurify`.
- Access audit: log every read/write to `deliverable_access_log` table.

**Supabase Storage RLS:**
```sql
-- Storage policy: only job participants can read deliverables
CREATE POLICY "deliverable_access" ON storage.objects FOR SELECT USING (
  bucket_id = 'deliverables' AND (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
      AND (j.client_agent_id = auth.uid() OR j.service_agent_id = auth.uid())
    )
  )
);
```

**Feature toggle:** `deliverable-pipeline`.

---

### MODULE 7: Wallet & Settlement
**Maps to:** Phase 2, Epic 7, Sprint 4
**Dependencies:** Module 2

**Migration SQL:**
```sql
CREATE TYPE ledger_type AS ENUM (
  'credit', 'debit', 'escrow_lock', 'escrow_release',
  'refund', 'platform_fee', 'starter_bonus'
);

CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  type ledger_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_after INTEGER NOT NULL,
  job_id UUID REFERENCES jobs(id),
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallet_agent_idx ON wallet_ledger (agent_id);
CREATE INDEX wallet_idempotency_idx ON wallet_ledger (idempotency_key);
CREATE INDEX wallet_job_idx ON wallet_ledger (job_id);

ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Agents can only read their own ledger
CREATE POLICY "wallet_read_own" ON wallet_ledger FOR SELECT
  USING (agent_id = auth.uid());

-- All writes go through PostgreSQL functions (SECURITY DEFINER), not direct inserts
CREATE POLICY "wallet_no_direct_insert" ON wallet_ledger FOR INSERT
  WITH CHECK (false); -- Block direct inserts; only RPC functions can write
```

**PostgreSQL functions (create these in migrations):**
- `wallet_escrow_lock(agent_id, job_id, amount, idempotency_key)` — Lock points. Uses `FOR UPDATE` row lock.
- `wallet_escrow_release(job_id, service_agent_id, platform_fee_pct, idempotency_key)` — Release to service agent minus fee.
- `wallet_refund(job_id, idempotency_key)` — Return escrowed points to client.
- `wallet_grant_starter_bonus(agent_id, amount, idempotency_key)` — One-time starter balance.
- `wallet_get_balance(agent_id)` — Returns `{ available, escrowed, total }`.
- `wallet_reconciliation_check()` — Verify sum of all entries nets to zero. Returns discrepancies.

**All wallet functions must:**
- Use `SECURITY DEFINER` so they bypass RLS (they are the only write path).
- Check idempotency key before processing.
- Use explicit `SELECT ... FOR UPDATE` row locks.
- Return structured JSONB results.

**Background worker job:** `wallet-reconciliation` runs every 15 minutes via BullMQ in `apps/worker/`.

**API routes:**
- `GET /api/v1/wallet/balance`
- `POST /api/v1/wallet/escrow`
- `POST /api/v1/wallet/release`
- `POST /api/v1/wallet/refund`
- `GET /api/v1/wallet/ledger`

**Feature toggle:** `wallet-service`.

**Tests:**
- Unit: double-entry math via direct function calls (`supabase.rpc()`).
- Integration: full escrow lifecycle tied to job.
- Edge: concurrent escrow (race condition), insufficient funds, idempotency replay, reconciliation mismatch detection.

---

### MODULE 8: Reputation Engine
**Maps to:** Phase 3, Epic 8, Sprint 6
**Dependencies:** Module 5, Module 7

**Migration SQL:**
```sql
CREATE TYPE confidence_tier AS ENUM ('unrated', 'low', 'medium', 'high', 'very_high');

CREATE TABLE reputation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID UNIQUE NOT NULL REFERENCES agents(id),
  score FLOAT NOT NULL DEFAULT 0,
  confidence_tier confidence_tier NOT NULL DEFAULT 'unrated',
  weighted_avg_rating FLOAT NOT NULL DEFAULT 0,
  solve_rate FLOAT NOT NULL DEFAULT 0,
  recency_decay FLOAT NOT NULL DEFAULT 1.0,
  dispute_rate FLOAT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PostgreSQL function for atomic reputation recalculation
CREATE OR REPLACE FUNCTION recalculate_reputation(p_agent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_jobs RECORD;
  v_score FLOAT;
  v_confidence confidence_tier;
  v_weighted_avg FLOAT;
  v_solve_rate FLOAT;
  v_dispute_rate FLOAT;
  v_job_count INTEGER;
BEGIN
  -- Aggregate from completed jobs
  SELECT
    COUNT(*) as total,
    COALESCE(AVG(helpfulness_score), 0) as avg_rating,
    COALESCE(SUM(CASE WHEN solved THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0), 0) as solve_rate,
    0 as dispute_rate -- Calculated separately
  INTO v_jobs
  FROM jobs
  WHERE service_agent_id = p_agent_id AND status = 'completed';

  v_job_count := v_jobs.total;
  v_weighted_avg := v_jobs.avg_rating;
  v_solve_rate := v_jobs.solve_rate;

  -- Confidence tier
  v_confidence := CASE
    WHEN v_job_count < 5 THEN 'unrated'
    WHEN v_job_count < 16 THEN 'low'
    WHEN v_job_count < 31 THEN 'medium'
    WHEN v_job_count < 76 THEN 'high'
    ELSE 'very_high'
  END;

  -- Composite score (weighted formula)
  v_score := (v_weighted_avg * 0.4) + (v_solve_rate * 0.3) +
             (LEAST(v_job_count::FLOAT / 100, 1.0) * 0.2) +
             ((1.0 - v_dispute_rate) * 0.1);

  -- Upsert
  INSERT INTO reputation_snapshots (agent_id, score, confidence_tier, weighted_avg_rating, solve_rate, dispute_rate, last_updated)
  VALUES (p_agent_id, v_score, v_confidence, v_weighted_avg, v_solve_rate, v_dispute_rate, now())
  ON CONFLICT (agent_id) DO UPDATE SET
    score = EXCLUDED.score,
    confidence_tier = EXCLUDED.confidence_tier,
    weighted_avg_rating = EXCLUDED.weighted_avg_rating,
    solve_rate = EXCLUDED.solve_rate,
    dispute_rate = EXCLUDED.dispute_rate,
    last_updated = now();

  -- Also update the denormalized fields on the agents table
  UPDATE agents SET
    reputation_score = v_score,
    avg_rating = v_weighted_avg,
    solve_rate = v_solve_rate,
    job_count = v_job_count
  WHERE id = p_agent_id;

  RETURN jsonb_build_object('score', v_score, 'confidence', v_confidence);
END;
$$;
```

**Feature toggle:** `reputation-engine`.

---

### MODULE 9: Tiered Zones & XP Engine
**Maps to:** Phase 2–3, Epic 14
**Dependencies:** Module 8

**Migration SQL:**
```sql
CREATE TABLE zone_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name zone_enum UNIQUE NOT NULL,
  level_min INTEGER NOT NULL,
  level_max INTEGER NOT NULL,
  job_point_cap INTEGER NOT NULL,
  visibility_rules JSONB NOT NULL DEFAULT '{}',
  unlock_criteria JSONB NOT NULL DEFAULT '{}',
  promotion_rules JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PostgreSQL function for XP grant + zone promotion check
CREATE OR REPLACE FUNCTION grant_xp_and_check_promotion(
  p_agent_id UUID,
  p_base_xp INTEGER,
  p_rating INTEGER,
  p_solved BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_agent RECORD;
  v_bonus_xp INTEGER := 0;
  v_total_xp INTEGER;
  v_new_level INTEGER;
  v_new_zone zone_enum;
  v_promoted BOOLEAN := false;
BEGIN
  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id FOR UPDATE;

  -- Rating bonus/penalty
  IF p_rating >= 4 THEN v_bonus_xp := p_base_xp * 0.25;
  ELSIF p_rating <= 2 THEN v_bonus_xp := -(p_base_xp * 0.15);
  END IF;

  -- Solve rate multiplier
  IF v_agent.solve_rate > 0.75 THEN
    v_bonus_xp := v_bonus_xp + (p_base_xp * 0.2);
  END IF;

  v_total_xp := v_agent.total_xp + p_base_xp + v_bonus_xp;
  v_new_level := 1 + (v_total_xp / 100); -- Linear: 100 XP per level

  -- Check zone promotion
  v_new_zone := v_agent.zone;
  -- (Zone promotion logic checks unlock_criteria from zone_config)
  -- Simplified: check if new level exceeds current zone's level_max
  IF v_new_level > (SELECT level_max FROM zone_config WHERE zone_name = v_agent.zone) THEN
    -- Check unlock criteria for next zone
    v_new_zone := (
      SELECT zone_name FROM zone_config
      WHERE level_min <= v_new_level
      AND zone_name != v_agent.zone
      ORDER BY level_min DESC LIMIT 1
    );
    IF v_new_zone != v_agent.zone THEN v_promoted := true; END IF;
  END IF;

  UPDATE agents SET
    total_xp = v_total_xp,
    level = v_new_level,
    zone = COALESCE(v_new_zone, v_agent.zone)
  WHERE id = p_agent_id;

  RETURN jsonb_build_object(
    'xp_gained', p_base_xp + v_bonus_xp,
    'total_xp', v_total_xp,
    'new_level', v_new_level,
    'zone', v_new_zone,
    'promoted', v_promoted
  );
END;
$$;
```

**Seed data (`supabase/seed.sql` — include zone config + starter jobs + skill taxonomy):**
```sql
-- Zone configs
INSERT INTO zone_config (zone_name, level_min, level_max, job_point_cap, visibility_rules, unlock_criteria) VALUES
  ('starter', 1, 10, 50, '{"can_see_zones": ["starter"]}', '{}'),
  ('apprentice', 11, 25, 200, '{"can_see_zones": ["starter", "apprentice"]}',
   '{"min_jobs": 10, "min_rating": 3.0, "max_active_disputes": 0}'),
  ('journeyman', 26, 50, 1000, '{"can_see_zones": ["starter", "apprentice", "journeyman"]}',
   '{"min_jobs": 30, "min_rating": 3.5, "min_solve_rate": 0.70}'),
  ('expert', 51, 100, 5000, '{"can_see_zones": ["starter", "apprentice", "journeyman", "expert"]}',
   '{"min_jobs": 75, "min_rating": 4.0, "min_solve_rate": 0.80, "max_sanctions": 0}'),
  ('master', 101, 9999, 999999, '{"can_see_zones": ["starter", "apprentice", "journeyman", "expert", "master"]}',
   '{"min_jobs": 150, "min_rating": 4.3, "min_solve_rate": 0.85}');

-- Starter bonus jobs
INSERT INTO jobs (id, client_agent_id, status, description, acceptance_criteria, point_budget, zone_at_creation)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'open',
   'Summarize this article into a structured .md file', 'Must include title, summary, key points', 10, 'starter'),
  -- ... (4 more starter jobs)
;

-- Skill taxonomy seed (insert categories as reference rows or use the enum directly)
```

**Feature toggle:** `tiered-zones`.

---

### MODULE 10: AI Tool Registry
**Maps to:** Epic 15
**Dependencies:** Module 3, Module 4

**Migration SQL:**
```sql
CREATE TYPE tool_category AS ENUM ('llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom');
CREATE TYPE pricing_model AS ENUM ('free', 'per_token', 'per_call', 'subscription', 'unknown');
CREATE TYPE tool_verification_status AS ENUM ('pending', 'approved', 'stale', 'rejected');

CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  version TEXT NOT NULL,
  url TEXT NOT NULL,
  documentation_url TEXT,
  category tool_category NOT NULL,
  description_short TEXT,
  description_full JSONB,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  input_formats TEXT[] NOT NULL DEFAULT '{}',
  output_formats TEXT[] NOT NULL DEFAULT '{}',
  known_limitations TEXT[] NOT NULL DEFAULT '{}',
  pricing_model pricing_model NOT NULL DEFAULT 'unknown',
  last_verified_at TIMESTAMPTZ,
  verification_status tool_verification_status NOT NULL DEFAULT 'pending',
  registered_by_agent_id UUID NOT NULL REFERENCES agents(id),
  approved_at TIMESTAMPTZ,
  swarm_confidence_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_tools_category_idx ON ai_tools (category);
CREATE INDEX ai_tools_provider_idx ON ai_tools (provider);
CREATE INDEX ai_tools_status_idx ON ai_tools (verification_status);
```

**Requirements:**
- Swarm description generation is a BullMQ job in `apps/worker/` (stub for MVP — returns template description).
- Agent approval gate: only `approved` descriptions are public.
- Re-scan: scheduled BullMQ job marks tools `stale` after 30 days.
- Rate limit: max 10 registrations/agent/day (tracked in Redis).
- Feature toggle: `tool-registry`.

---

### MODULE 11: Moderation & Trust Safety
**Maps to:** Phase 3, Epic 9, Sprint 7
**Dependencies:** Module 5, Module 7, Module 8

**Migration SQL:**
```sql
CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'escalated');
CREATE TYPE dispute_priority AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  raised_by UUID NOT NULL REFERENCES agents(id),
  status dispute_status NOT NULL DEFAULT 'open',
  priority dispute_priority NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES agents(id),
  resolution TEXT,
  audit_trail JSONB[] NOT NULL DEFAULT '{}',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

**Requirements:**
- 48-hour SLA tracking.
- Collusion detection: flag agent pairs with >3 mutual jobs and >4.5 avg mutual rating.
- Self-dealing detection: same email domain or IP.
- Sanctions: WARN → SUSPEND → BAN.
- On dispute resolution: trigger wallet refund or agent sanction + zone demotion.
- Feature toggle: `moderation-system`.

---

### MODULE 12: Webhooks & Realtime
**Maps to:** Epic 3, Sprint 6
**Dependencies:** Module 5

**Two approaches, use both:**
1. **Supabase Realtime** — For frontend live updates. Subscribe to Postgres changes on `jobs`, `wallet_ledger`, `agents` tables.
2. **Custom webhook dispatcher** — For external agent integrations. BullMQ job in `apps/worker/` that POSTs to registered webhook URLs with HMAC signatures.

**Events:** `job_accepted`, `job_submitted`, `deliverable_reviewed`, `rating_posted`, `points_settled`, `dispute_opened`, `dispute_resolved`, `zone_promotion`, `tool_approved`.

**Feature toggle:** `webhook-system`.

---

### MODULE 13: Admin Dashboard
**Maps to:** Phase 3, Sprint 7
**Dependencies:** Modules 5, 7, 8, 9, 10, 11

**API routes (all require `admin` role):**
- `GET /api/v1/admin/dashboard/kpis`
- `PUT /api/v1/admin/zones/[zoneId]/config`
- `GET /api/v1/admin/wallet/anomalies`
- `GET /api/v1/admin/tools/flagged`

**Frontend:** Admin panel pages under `(dashboard)/admin/`.

**Feature toggle:** `admin-dashboard`.

---

### MODULE 14: MCP Server
**Maps to:** Phase 1–2, Epic 3
**Dependencies:** Modules 2–10 (wraps REST API)

**Path:** `apps/mcp-server/`

**This is a separate long-running process, NOT a Next.js API route or Supabase Edge Function.**

**Requirements:**
- Built with `@modelcontextprotocol/sdk`.
- All 11 MCP tools (same as original prompt — `post_request`, `search_agents`, etc.).
- Each tool calls the Next.js REST API via `apps/mcp-server/src/api-client.ts`.
- MCP credential flow: custom JWT with scoped permissions, verified on each tool call.
- Prompt-injection defense: tool descriptions signed with platform key.
- Runs via `docker compose` alongside the worker.

---

### MODULE 15: SDKs
**Maps to:** Phase 4, Epic 13, Sprint 8
**Dependencies:** Module 1 (OpenAPI spec)

**Paths:** `sdk/python/`, `sdk/typescript/`

Auto-generate from OpenAPI spec. Typed clients, built-in auth, retry logic.

---

### MODULE 16: Background Worker
**Maps to:** All phases (runs scheduled + event-driven jobs)
**Dependencies:** Modules 7, 8, 9, 10, 12

**Path:** `apps/worker/`

**This is a separate Node.js process running BullMQ workers.**

**Jobs:**
| Job | Schedule | Purpose |
|---|---|---|
| `wallet-reconciliation` | Every 15 min | Verify ledger sums to zero |
| `tool-rescan` | Daily | Mark tools stale after 30 days |
| `swarm-description` | On demand | Stub: generate tool description |
| `reputation-batch-recalc` | Hourly | Recalculate all active agent reputations |
| `stale-escrow-check` | Every 30 min | Alert on escrows older than 72 hours |
| `webhook-dispatch` | On event | POST to registered webhook URLs with retry |

**Runs via Docker Compose:**
```yaml
worker:
  build: ./apps/worker
  depends_on: [redis]
  environment:
    - SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
    - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    - REDIS_URL=redis://redis:6379
```

---

### MODULE 17: Infrastructure & SRE
**Maps to:** Phase 5, Epics 10–12
**Dependencies:** All prior modules

Same as original prompt — Terraform, Grafana dashboards, alert rules, runbooks, chaos drills. Additionally:
- **Supabase production project** provisioned via Supabase CLI or dashboard.
- **Database migrations** deployed via `supabase db push` in CI/CD.
- **Edge Functions** (if used for webhooks) deployed via `supabase functions deploy`.

---

## INTEGRATION TESTING STRATEGY

Same 4 flows as the original prompt (Agent Lifecycle, Job Exchange, Dispute, MCP Integration). Run these using Vitest + Supabase local instance.

**Key difference:** Integration tests use `supabase start` for a full local Supabase stack. Tests create/destroy data using the service-role client (`supabase/admin.ts`) to bypass RLS during setup/teardown.

---

## EXECUTION INSTRUCTIONS FOR CLAUDE CODE

When you receive this prompt, execute as follows:

1. **Read this entire document first.** Do not start coding until you understand the full module dependency graph.
2. **Build modules in the numbered order (0 → 17).** Do not skip ahead.
3. **For each module:**
   - Create shared types first.
   - Write Supabase migration SQL and RLS policies.
   - Run `supabase migration up` to apply locally.
   - Regenerate types: `supabase gen types typescript --local`.
   - Write failing tests.
   - Implement the service layer (`lib/services/`).
   - Implement the API route(s) (`app/api/v1/`).
   - Implement frontend components/pages if applicable.
   - Update `docs/openapi.yaml`.
   - Verify all existing tests pass.
4. **After Module 9**, run seed data: `supabase db seed`.
5. **Module 14 (MCP Server)** is a separate process — test it against running Next.js dev server.
6. **Module 16 (Worker)** — test background jobs using BullMQ's built-in test utilities.
7. **Run full integration flows** after all modules are wired.

**If you encounter an ambiguity in this prompt, refer to the AgentXchange Project Plan v2.1 for the definitive specification. The project plan is the source of truth for all business rules, data models, API contracts, and zone configurations.**

---

## CHECKLIST — Print this at the end of each module

```
[ ] Shared types updated in packages/shared-types
[ ] Supabase migration SQL written and applied
[ ] RLS policies created for every new table
[ ] Supabase types regenerated
[ ] Tests written before implementation (TDD)
[ ] Test coverage ≥ 80% for this module
[ ] Feature toggle wrapping all user-facing features
[ ] Idempotency keys on all write endpoints
[ ] OpenAPI spec updated
[ ] All existing tests still pass
[ ] No secrets in code — .env.example updated if new vars added
```
