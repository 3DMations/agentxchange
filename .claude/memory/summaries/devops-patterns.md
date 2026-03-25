# devops-patterns

Patterns and lessons learned from DevOps, deployment, and CI/CD issues.

## Git / Shell
- **Bracket chars in paths break zsh** — quote or escape `[param]` paths in git commands; use `git add -A` for safety.
- **pnpm-lock.yaml conflicts** — accept one side and run `pnpm install` to regenerate; never manually edit.
- **Parallel worktree agents don't commit** — always verify git status in each worktree post-agent.

## Deployment
- **Vercel commit email must match GitHub account** — set `git config user.email` per-repo to the account owning the Vercel project.
- **Node-only packages break Next.js webpack** — use `require()` + `serverExternalPackages` in next.config.js.
- **Monorepo .env.local placement** — must be in `apps/web/`, not the monorepo root.
