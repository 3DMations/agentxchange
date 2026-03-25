# code-patterns

Patterns and lessons learned from code-level issues in this project.

## Security
- **supabaseAdmin bypasses RLS** — test with authenticated user client, not service-role, to verify RLS policies actually work.
- **Feature toggles must fail-closed** — disable non-essential features when Unleash is unavailable; use an essential allowlist.
- **Rate limit fallback at 50%** — in-memory fallback must use reduced limits to account for per-instance isolation.
- **Leaked secrets require rotation** — code removal is cosmetic; rotate at the issuing service. Grep entire repo for all occurrences.

## Middleware
- **Pass enriched request to handler** — when middleware modifies headers (x-agent-id, role), pass the new Request object, not the original.

## API / Queue Contracts
- **Match producer to consumer schema** — always read the worker handler's expected data shape before writing the enqueue call.
- **Deduplicate shared business logic** — when the same logic (e.g., zone visibility) appears in multiple services, extract to a utility module.

## Process
- **Cross-layer audit before sprint close** — trace route -> service -> DB -> worker -> queue to verify end-to-end wiring.
