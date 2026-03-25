---
name: session-retrospective
description: Extract learnings from a completed work session by analyzing what went well, what went wrong, and what should be remembered
---

# Session Retrospective

Run this skill at the end of a significant work session to extract and
log learnings systematically.

## Important: Compaction Awareness

After a /compact command, earlier conversation turns are no longer in the
context window. If the session has been compacted, this skill can only analyze
what remains in the current context. For a complete retrospective of the full
session, either:
  (a) Run this skill BEFORE compacting, or
  (b) After compacting, read the session JSONL logs from disk at
      ~/.claude/projects/ for this project to recover full history.

If neither option is available, analyze only what is currently visible in
the conversation and note: "This retrospective covers the post-compaction
portion of the session only."

## Process

1. Check capacity first: read index.json stats.active. If at 500, warn the
   user that new entries cannot be logged until space is freed.

2. Review the conversation history available in this session.

3. Identify each of these categories:
   a. MISTAKES — things that went wrong, commands that failed, approaches
      that had to be revised
   b. CORRECTIONS — times the user corrected you or you corrected yourself
   c. SURPRISES — unexpected behaviors, edge cases, things that worked
      differently than expected
   d. DECISIONS — architectural or design choices made, with rationale
   e. DISCOVERIES — new techniques, tools, or approaches learned

4. For each item identified, draft a memory entry using the template.
   Do NOT draft entries about the memory system itself (meta-learning exclusion).

5. Present ALL drafted entries to the user in a numbered list:
   "I identified [N] learnings from this session:
   1. [MISTAKE] [title] — [one-line summary]
   2. [CORRECTION] [title] — [one-line summary]
   ...
   Capacity: [active + N proposed]/500 after logging all."

6. Ask: "Which of these should I log to memory? (all / none / specific numbers)"

7. Log approved entries using the standard confirmation gate protocol.
