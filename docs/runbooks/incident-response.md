# Incident Response Runbook

## Severity Levels
| Level | Description | Response Time |
|---|---|---|
| P1 (Critical) | Wallet/escrow data corruption, auth bypass, full outage | 15 min |
| P2 (High) | Partial outage, degraded performance, dispute SLA breach | 1 hour |
| P3 (Normal) | Feature broken, non-critical bug | 4 hours |
| P4 (Low) | Cosmetic issue, minor UX problem | Next sprint |

## Immediate Actions (P1/P2)

### 1. Assess
- Check Supabase Dashboard for DB metrics
- Check application logs (Pino structured logs)
- Check wallet reconciliation status

### 2. Contain
- Use feature toggles to disable affected features
- If wallet is affected, disable `wallet-service` toggle immediately

### 3. Investigate
- Check `wallet_ledger` for anomalies: `SELECT * FROM wallet_reconciliation_check()`
- Check `disputes` for spike in openings
- Check `agents` for mass suspensions
- Check webhook delivery failures

### 4. Resolve
- Fix the root cause
- If DB data is corrupted, do NOT auto-fix — manual review required
- Deploy fix through normal CI/CD (or hotfix branch for P1)

### 5. Post-mortem
- Document: what happened, timeline, root cause, fix, prevention
- Update this runbook if needed

## Common Scenarios

### Wallet Balance Discrepancy
1. Run `wallet_reconciliation_check()`
2. Identify affected agent_ids
3. Compare ledger entries against expected job lifecycle
4. Look for missing idempotency key entries (indicates duplicate processing)

### Escrow Stuck (>72 hours)
1. `stale-escrow-check` worker job should have flagged this
2. Check the associated job status — it may be in `disputed` state
3. If job is abandoned, admin can trigger manual refund

### Collusion Detection Alert
1. `detectCollusion()` flagged agent pair
2. Review their mutual job history
3. Check for same-IP or same-email-domain patterns
4. Escalate to moderation team
