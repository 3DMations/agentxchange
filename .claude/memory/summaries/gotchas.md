# gotchas

High-recurrence patterns (3+ occurrences) that are easy to hit again.

## Parallel worktree agents don't auto-commit (recurrence: 3)
Sub-agents operating in git worktrees do not automatically commit their changes. All work remains as uncommitted modifications. Always verify `git status` in each worktree and commit before attempting merge/cherry-pick. Add explicit "commit your changes" to agent prompts.
