# Contributing to AgentXchange

Thanks for your interest in contributing! This guide will help you get started.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Before You Start

- **Search first**: Check [existing issues](https://github.com/3DMations/agentxchange/issues) and [pull requests](https://github.com/3DMations/agentxchange/pulls) to avoid duplicates.
- **Bug fixes and docs**: Go ahead and open a PR.
- **New features**: Open an issue first to discuss the approach. This prevents wasted effort if the feature doesn't align with the project direction.
- **Security issues**: See [SECURITY.md](SECURITY.md) — do not open a public issue.

## Development Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 10
- Docker (for local Redis and Unleash)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/3DMations/agentxchange.git
cd agentxchange

# Install dependencies
pnpm install

# Set up environment
cp apps/web/.env.production.example apps/web/.env.local
# Edit .env.local with your Supabase, Redis, and Unleash credentials

# Start local infrastructure (Redis, Unleash)
docker compose up -d

# Start development
pnpm dev

# Run tests
pnpm test

# Type check
pnpm type-check

# Build everything
pnpm build
```

### Project Structure

```
apps/
  web/            Next.js 14 frontend + API routes
  worker/         BullMQ background job processor
  mcp-server/     Model Context Protocol server
packages/
  shared-types/   TypeScript interfaces shared across all apps
sdk/
  typescript/     Auto-generated SDK from OpenAPI spec
```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `fix/short-description` for bug fixes
- `feat/short-description` for features
- `docs/short-description` for documentation
- `refactor/short-description` for refactoring

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add webhook retry dashboard
fix: correct escrow release calculation
docs: update API endpoint table in README
test: add wallet service edge case tests
chore: update dependencies
refactor: extract rate limit middleware
```

Keep the subject line under 72 characters. Use the body for context on *why*, not *what*.

### Code Guidelines

- **TypeScript**: All code is TypeScript. Run `pnpm type-check` before pushing.
- **Testing**: Write tests for new features and bug fixes. Target >= 80% coverage. Run `pnpm test`.
- **Shared types**: All cross-module interfaces go in `packages/shared-types/` — never duplicate types.
- **API responses**: Use the `ApiResponse<T>` envelope with `apiSuccess()` and `apiError()`.
- **Validation**: Use Zod for all API input validation.
- **No secrets in code**: Use environment variables. See `.env.production.example` for the full list.

### Pull Request Guidelines

- **Keep PRs focused**: One concern per PR. Aim for under 500 lines changed.
- **Link the issue**: Use `Closes #123` or `Fixes #456` in the PR description.
- **Self-review**: Review your own diff before requesting review.
- **Tests pass**: Ensure `pnpm test`, `pnpm type-check`, and `pnpm build` all pass locally.
- **Screenshots**: Include before/after screenshots for UI changes.
- **New env vars**: Document any new environment variables in `.env.production.example`.
- **Migrations**: Database migrations must be additive-only (never rename or delete columns).
- **Allow edits**: Enable "Allow edits from maintainers" on your PR.

## Running Individual Apps

```bash
pnpm --filter @agentxchange/web dev        # Web app only
pnpm --filter @agentxchange/worker dev      # Worker only
pnpm --filter @agentxchange/mcp-server dev  # MCP server only
```

## Getting Help

- Open a [Discussion](https://github.com/3DMations/agentxchange/discussions) for questions
- Check the [docs](https://agentxchange-web.vercel.app/docs) for architecture details
- Review `CLAUDE.md` for the full project conventions and module build order

## License

By contributing to AgentXchange, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
