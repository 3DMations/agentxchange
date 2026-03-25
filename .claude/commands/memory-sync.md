---
description: Reorganize, deduplicate, and regenerate memory summary files
---

Present this to the user before starting:
"Memory sync will: (1) scan for structural issues, (2) deduplicate,
(3) regenerate all summary files (including gotchas and decisions),
(4) propose archival IF capacity is above 80%.
No content will be rewritten — only sorted, merged, and compressed.
I'll show you every change before making it. Proceed?"

Wait for confirmation. Then:

1. SCAN — Read all files in .claude/memory/learnings/.
   - Check each entry against audit-rules.md structural rules (S1-S7).
   - Flag violations but do NOT fix yet.

2. DEDUPLICATE — Compare all entry pairs on title + trigger_context + tags.
   - Read threshold from taxonomy.yaml dedup_jaccard_threshold (default 0.6).
   - Pairs exceeding threshold -> flag as duplicate pair.
   - Present duplicates to user. For each pair, propose: merge into one
     (keeping the richer entry, incrementing recurrence) or keep both.

3. REGENERATE — Two-pass regeneration from ALL active entries.

   PASS A — Category-mapped summaries:
   For each category in taxonomy.yaml, read all active entries matching
   that category. Synthesize into the corresponding summary_file listed
   in taxonomy.yaml (code-patterns.md, devops-patterns.md, etc).

   PASS B — Cross-cutting summaries:
   For gotchas.md: read ALL active entries where recurrence_count >= 3,
   regardless of category. Synthesize the top recurring patterns into
   gotchas.md, organized by frequency (most recurrent first).
   For decisions.md: read ALL active entries where type = "decision",
   regardless of category. Synthesize into decisions.md, organized
   chronologically (most recent decision first).

   For both passes: extract generalizable principles, resolve contradictions
   (flag for user if unresolvable), compress into concise imperative
   statements. NEVER rewrite original entry prose.

   NOTE: Regeneration happens BEFORE archival so that insights from
   about-to-be-archived entries are captured in summaries first.

4. ARCHIVAL (only if stats.active >= 400) —
   Score all entries using the value formula from rule 22 in memory-system.md:
   value_score = (recurrence_count * 2) + (successful_applications * 3)
                 - (days_since_last_seen / 30)
   Present the 20 lowest-scoring entries to the user. For each, show:
   title, value_score, last_seen date, and which summary file holds its insight.
   Ask: "Archive these? (all / none / specific numbers)"
   For approved entries:
   - Verify insight is captured in the relevant summary file
   - Set preserved_in_summary field to the summary filename
   - Move file from learnings/ to archive/
   - Update index.json (decrement stats.active, increment stats.archived)

   If stats.active < 400, skip this step entirely and report:
   "Capacity at [active]/500 — archival not needed."

5. RECONCILE INDEX — Count actual files in learnings/ and archive/.
   Recalculate stats.total, stats.active, stats.archived from disk.
   Update last_sync to current timestamp.
   Update total_at_last_sync to current stats.total.
   If counts differ from what was in index.json, note the correction.

6. LOG — Append a dated entry to .claude/memory/audit-log.md recording
   what was done.

7. REPORT — Show the user a summary:
   "Memory sync complete:
   - Entries scanned: X
   - Duplicates merged: Y
   - Summary files regenerated: 8 (6 category + gotchas + decisions)
   - Entries archived: Z
   - Structural issues found: N (fixed: M, remaining: K)
   - Index reconciled: [yes if counts changed / no drift detected]
   - Capacity: [active]/500 ([percent]% remaining)
   - Next recommended sync: [date based on entry velocity]"
