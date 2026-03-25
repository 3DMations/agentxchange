---
description: Deep audit of memory system health — enforces all rules, reports violations, proposes fixes
---

This is the comprehensive curation/audit command. It enforces EVERY rule in
.claude/rules/audit-rules.md and produces a full health report.

Present to user: "Running full memory audit. This checks structural integrity,
content quality, performance limits, and security rules. All findings will be
presented before any action is taken."

## Phase 1: Structural Integrity (audit-rules S1-S7)
- Validate every entry in learnings/ has complete frontmatter
- Cross-reference index.json against actual files on disk
- Reconcile index.json stats against actual file counts (rule S7)
- Check for orphaned files, dangling references, invalid IDs, bad dates
- Report: list of violations with proposed auto-fixes

## Phase 2: Content Quality (audit-rules Q1-Q6)
- Run duplicate detection across all active entries
- Identify archival candidates ONLY if active >= 400 (Q3)
- Check gotchas.md coverage for high-recurrence items (Q2)
- Verify related_files still exist in the project (Q4)
- Check summary freshness: entries since last sync (Q5)
- Analyze category distribution for taxonomy health (Q6)
- Report: list of quality issues requiring user decision

## Phase 3: Performance Check (audit-rules P1-P4)
- Count active entries (warn if > 450, block if >= 500)
- Measure summary file line counts (warn if > 80)
- Measure CLAUDE.md line count (warn if > 200)
- Check individual entry sizes (warn if > 50 lines)
- Report: performance metrics with recommendations

## Phase 4: Security Scan (audit-rules X1-X3)
- Scan ALL memory files for credential patterns (prefixed patterns from X1 only)
- Check for .env / .ssh / .aws references without [REDACTED]
- Check for PII in files that would be git-committed
- Report: BLOCK any violations, show exact locations

## Output

Present the audit report as a structured summary showing: how many structural
issues were found (and how many are auto-fixable), how many quality issues need
the user's decision, whether performance is green/yellow/red, how many security
violations were found (these are blocking), and an overall health rating of
HEALTHY, NEEDS ATTENTION, or CRITICAL.

Include capacity: "[active]/500 entries ([percent]% remaining)"

Then present each category's findings. For each finding: what the issue is,
which rule it violates, and the proposed fix (or options if user decision needed).
Wait for batch or per-item approval before applying fixes.

Log all actions to .claude/memory/audit-log.md.
Update last_audit timestamp in index.json when complete.
