# Future Project Plans

Ideas to revisit after the website is secured and stable.

## Interactive API Documentation — Advanced Options

**Context:** For the initial launch we're using Scalar (MIT-licensed) + auto-generated SDK snippets (Option C). These more ambitious ideas should be revisited once security is locked down.

### Stoplight Elements
- Full-featured OpenAPI explorer with mock server support
- Heavier bundle but richer feature set than Scalar
- Could replace Scalar if we need more advanced features (e.g., webhooks visualization, schema navigation)

### Try-It-Now Playground
- Authenticated sandbox environment where developers can fire real requests
- Requires: sandbox API keys, request/response logging, rate limiting for playground traffic
- Security considerations: sandboxed auth tokens, CORS for playground origin, CSP adjustments
- Reference implementations: Stripe API docs, Postman embedded collections

### OpenAPI-Powered Code Generator
- Generate runnable code samples in 5+ languages directly from the spec
- Could auto-generate MCP tool invocation examples alongside REST/SDK samples
- Tools to evaluate: openapi-generator, Kiota, custom Handlebars templates

### API Changelog & Versioning UI
- Visual diff of OpenAPI spec changes between versions
- Breaking change detection and migration guides
- Reference: Bump.sh, Optic

## Sprint 8: CI/CD Hardening & Deployment Safety

**Context:** Research completed 2026-03-27 via 4-persona panel (DevOps, Vercel Specialist, Release Engineering, DevSecOps). Execute after UI phases are complete.

**Priority:** Before any beta/launch with real transactions.

### P0 — Immediate (30 min total)
- [x] Pin all GitHub Actions to commit SHAs (actions/checkout, pnpm/action-setup, actions/setup-node) — CVE-2025-30066 supply chain risk
- [x] Add `permissions: contents: read` to ci.yml — currently inherits overly broad defaults
- [x] Add `pnpm audit --audit-level=high` step to CI
- [x] Delete `cd-dev.yml` (was causing false failures — Vercel handles deployment natively)
- [ ] Enable Vercel staged promotion (requires Vercel dashboard — disable "Auto-assign Custom Production Domains" in project settings)
- [ ] Enable Vercel Rolling Releases (requires Vercel dashboard)

### P0 — Branch Protection (Manual Steps)
- [ ] Enable branch protection on main (requires GitHub settings — see setup steps below)

### Branch Protection Setup (Manual Steps)

To enable branch protection on `main`:
1. Go to GitHub repo Settings > Branches > Add branch protection rule
2. Branch name pattern: `main`
3. Enable: "Require a pull request before merging" (optional for solo dev)
4. Enable: "Require status checks to pass before merging"
   - Add required check: "Build and Test"
   - Add required check: "Secret Scanning"
5. Enable: "Require linear history"
6. Enable: "Do not allow bypassing the above settings"
7. DO NOT enable: "Require signed commits" (defer to P2)

### P1 — CI Security Scanning (1-2 hrs)
- [x] Add Gitleaks secret scanning to CI (prevent repeat of leaked Supabase key)
- [ ] Add Semgrep SAST with `p/owasp-top-ten` + `p/typescript` rulesets
- [x] Create `.github/dependabot.yml` for automated dependency update PRs
- [ ] Add license compliance check (`pnpm licenses list`)

### P1 — CD Pipeline Wiring (2-3 hrs)
- [x] Delete `cd-dev.yml` (was causing false failures — Vercel handles deployment)
- [ ] Transform `cd-staging.yml` into real workflow: migrations + Railway deploys
- [ ] Create `cd-prod.yml` with GitHub Environment "production" + required reviewer
- [ ] Wire `supabase db push` for staging and production (migration-before-deploy ordering)
- [x] Add CODEOWNERS for `supabase/migrations/` directory

### P1 — Environment Setup (1-2 hrs)
- [ ] Set up second Supabase project for staging
- [ ] Create Vercel custom "Staging" environment with branch rules + stable domain
- [ ] Separate Vercel env vars: production vs preview credentials
- [ ] Enable Vercel Authentication on preview deployments

### P2 — Compliance & Audit Trail
- [ ] Require signed commits on main (SSH signing keys)
- [ ] Add SBOM generation (CycloneDX) for PCI DSS 4.0 Req 6.3.2
- [ ] Add `supabase db push --dry-run` to CI for migration validation
- [ ] Configure Vercel deployment protection (password protection on staging)
- [ ] Document rollback procedures

### Key Decisions (from panel research)
- **Vercel native deployment** for web app — no custom GitHub Actions CD needed
- **GitHub Actions CD** only for Railway (worker, MCP server) and database migrations
- **Two-environment model** (staging + prod) — dev handled by Vercel preview deployments
- **Push-to-main→prod OK during development**, must change before real transactions
- **Approval gate**: Vercel staged promotion for web app, GitHub Environment protection for Railway/migrations

### Sources
- CISA CVE-2025-30066 (tj-actions supply chain attack, March 2025)
- Vercel Staged Promotion docs (Oct 2025)
- Vercel Rolling Releases docs (2025)
- PCI DSS 4.0 Requirements 6.3.2, 6.5.3, 6.5.4
- OWASP CI/CD Security Cheat Sheet (2025)
- Supabase Managing Environments docs

---

## Other Deferred Ideas

_(Add future ideas here as they come up)_

---

*Last updated: 2026-03-27 (Sprint 8 P0/P1 items partially completed)*
