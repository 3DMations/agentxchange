---
description: Review logged mistakes and learnings, optionally filtered by category
argument-hint: [category] (optional — code, devops, infrastructure, research, writing, conversation)
---

1. Read .claude/memory/index.json for the full entry list.

2. If $ARGUMENTS is provided, filter to entries matching that category.
   If not, show all active entries.

3. Sort entries by priority:
   - First: entries with recurrence_count >= 3 (systemic problems)
   - Second: entries with confidence_score < 0.3 (poorly internalized)
   - Third: entries with type = "decision" (architecture decisions)
   - Fourth: all remaining active entries sorted by last_seen descending

4. Present a summary table:
   | # | ID | Title | Category | Type | Recurrence | Confidence | Apps | Last Seen |

5. Show capacity: "[active]/500 entries used ([percent]% remaining)"

6. Ask the user:
   "Would you like to:
   (a) Read a specific entry in full — give me the number
   (b) See recommendations for CLAUDE.md rule additions
   (c) See archival candidates (lowest-value entries)
   (d) Done"

7. For option (b): identify entries with recurrence >= 3 that do NOT have
   a corresponding rule in CLAUDE.md. Propose specific imperative lines
   to add. Show change plan. Wait for confirmation.

8. For option (c): score all entries using the value formula from rule 22
   in memory-system.md. Show the 10 lowest-scoring entries and offer to
   archive them.
