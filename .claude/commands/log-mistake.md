---
description: Log a mistake, learning, or insight to persistent memory
argument-hint: <brief description of what happened>
---

Follow these steps exactly:

1. Check capacity: read .claude/memory/index.json. If stats.active >= 500,
   tell the user: "Memory is at capacity (500/500). Run /project:memory-sync
   to archive low-value entries before logging new ones." Stop here.

2. Generate an entry ID: learn-{today's date as YYYY-MMDD}-{next sequence number}.
   Check .claude/memory/learnings/ for existing entries today to get the sequence.

3. Search existing entries for duplicates: compare $ARGUMENTS against titles
   and trigger_contexts of entries in .claude/memory/index.json.
   Read dedup_jaccard_threshold from .claude/memory/taxonomy.yaml (default 0.6).
   If a match exists exceeding that threshold:
   - Show the existing entry to the user.
   - Ask: "This looks similar to an existing entry. Should I update that one
     instead of creating a new one?"
   - If yes: increment recurrence_count, update last_seen, and append new
     context to the existing entry. Show the change plan. Wait for confirmation.
   - If no: proceed with new entry creation.

4. Determine category and subcategory from the current work context and
   .claude/memory/taxonomy.yaml.

5. Fill out the TEMPLATE.md with:
   - title: from $ARGUMENTS
   - category + subcategory: inferred from context
   - type: mistake / learning / insight / pattern / anti-pattern / decision
   - severity: infer from impact (blocker/critical/major/minor/trivial)
   - trigger_context: what was happening when this occurred
   - root_cause: why it happened (your analysis)
   - related_files: files being edited in this session
   - successful_applications: 0 (new entry)
   - preserved_in_summary: "" (not yet summarized)
   - The "What Happened" and "Correct Solution" sections from session context

6. Present the COMPLETE entry to the user in the confirmation gate format.
   Wait for explicit approval.

7. On confirmation:
   - Write the entry file to .claude/memory/learnings/
   - Update .claude/memory/index.json (add to entries, increment stats.total
     and stats.active)
   - If this entry has recurrence_count >= 3, update gotchas.md
   - Report: "Logged to memory: [title] ([id]) — [active]/500 capacity used"
