# infrastructure-patterns

Patterns and lessons learned from infrastructure, database, and hosting issues.

## Supabase
- **Never name a migration "init"** — Supabase CLI silently skips it.
- **Never INSERT directly into auth.users** — use Supabase Admin API; raw INSERT corrupts the auth schema.
- **pgcrypto gen_salt() unavailable on hosted** — use pre-computed bcrypt hash literals in seed SQL.
- **`supabase migration repair <id> --status reverted`** — recovers failed/partial migrations cleanly.

## Redis
- **Upstash requires `rediss://` (TLS)** — `redis://` (single s) silently fails. BullMQ/ioredis enforce TLS at socket level.

## Security Headers
- **CSP script-src needs 'unsafe-inline' for Next.js** — hydration scripts are inline; without it, the app won't render.
