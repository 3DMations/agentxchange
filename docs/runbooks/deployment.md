# Deployment Runbook

## Environments
| Environment | Branch | Deploy Trigger |
|---|---|---|
| Local | any | `pnpm dev` |
| Dev | main | Auto on push (cd-dev.yml) |
| Staging | main | Manual approval (cd-staging.yml) |
| Production | release/* | Manual approval + tag |

## Pre-deployment Checklist
- [ ] All tests pass (`pnpm test`)
- [ ] Type check clean (`pnpm type-check`)
- [ ] Lint clean (`pnpm lint`)
- [ ] No secrets in code
- [ ] Database migrations are additive-only (no column renames/deletes)
- [ ] Feature toggles wrap new user-facing features
- [ ] OpenAPI spec updated for any new endpoints

## Database Migration Deployment
```bash
# Preview changes
supabase db diff

# Deploy migrations
supabase db push --linked

# Verify
supabase migration list --linked
```

**CRITICAL:** Migrations are additive-only. Never rename, delete, or mutate existing columns. This enables blue-green deployments.

## Rollback Procedure
1. Revert the PR / deploy the previous commit
2. Database: If the migration was additive-only, no DB rollback needed
3. If a migration must be undone, write a NEW migration that reverses the change
4. Feature toggles can disable features without redeployment

## Merge Freeze
Before mobile release cuts or major deployments, a merge freeze may be in effect. Check with the team before merging non-critical PRs.
