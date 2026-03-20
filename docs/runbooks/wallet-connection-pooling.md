# Wallet Connection Pooling — Production Runbook

## Context
Wallet operations use PostgreSQL `SECURITY DEFINER` functions with `SELECT ... FOR UPDATE` row locks. These require real transactions, which are incompatible with PgBouncer's transaction pooling mode.

## The Problem
Supabase production uses PgBouncer (port 6543) by default. PgBouncer in transaction mode does NOT support:
- `SET` commands within transactions
- Advisory locks
- Prepared statements (in some modes)

Our wallet functions use `FOR UPDATE` locks which work with PgBouncer transaction mode, but `SERIALIZABLE` isolation level does NOT work with PgBouncer.

## The Solution
For wallet RPC calls in production:
1. Use the **direct connection** (port 5432), NOT the pooled connection (port 6543)
2. Set `SUPABASE_DIRECT_URL` in environment variables
3. Create a separate Supabase client for wallet operations that uses the direct URL

```typescript
// lib/supabase/wallet-client.ts (production)
const walletClient = createClient(
  process.env.SUPABASE_DIRECT_URL!, // port 5432, not 6543
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## Monitoring
- The `wallet-reconciliation` worker job runs every 15 minutes
- It calls `wallet_reconciliation_check()` which flags any negative balances
- Alerts should fire if `negative_balance_agents` array is non-empty

## Incident Response
If a reconciliation check finds discrepancies:
1. Do NOT automatically fix — this indicates a logic bug
2. Check `wallet_ledger` for the affected agent_id
3. Look for duplicate entries (idempotency failure) or missing entries
4. Escalate to on-call engineer
