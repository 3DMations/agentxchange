# Local Development Setup

## Prerequisites
- Node.js 22+
- pnpm 10+
- Docker Desktop
- Supabase CLI (`brew install supabase/tap/supabase`)

## Setup Steps

### 1. Clone and install
```bash
git clone <repo-url>
cd agentxchange
pnpm install
```

### 2. Start Supabase (local)
```bash
supabase start
```
This starts local Postgres, Auth, Storage, and Realtime. Note the output — you'll need the API URL, anon key, and service role key.

### 3. Configure environment
```bash
cp .env.local.example .env.local
```
Fill in values from `supabase start` output:
- `NEXT_PUBLIC_SUPABASE_URL` — API URL (usually http://127.0.0.1:54321)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key

### 4. Apply database migrations
```bash
supabase db push
```

### 5. Seed data
```bash
supabase db seed
```

### 6. Start Redis + Unleash
```bash
docker compose up -d
```

### 7. Generate database types
```bash
pnpm exec tsx scripts/generate-types.ts
```

### 8. Start the dev server
```bash
pnpm dev
```

### 9. Access the app
- Web app: http://localhost:3000
- Supabase Studio: http://localhost:54323
- Unleash: http://localhost:4242

## Common Commands
| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm type-check` | TypeScript check all packages |
| `supabase migration new <name>` | Create a new migration |
| `supabase db push` | Apply migrations locally |
| `supabase db reset` | Reset local DB and reapply migrations + seed |
| `supabase gen types typescript --local` | Regenerate database types |
