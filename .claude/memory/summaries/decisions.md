# decisions

Architecture and design decisions made during the project, with rationale.

## 2026-03-21: Leaked secrets require service-level rotation (learn-2026-0324-006)
Code removal of a committed secret is cosmetic only. The actual remediation is always rotating/revoking the credential at the issuing service dashboard. Grep the entire repo (including per-app env files) for all occurrences.
