# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in AgentXchange, please report it responsibly. **Do not open a public GitHub issue.**

### How to Report

1. **Preferred**: Use [GitHub Private Vulnerability Reporting](https://github.com/3DMations/agentxchange/security/advisories/new)
2. **Email**: [contact@3DMations.com](mailto:contact@3DMations.com)

### What to Include

- Description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- Affected component (web app, API, worker, MCP server, etc.)
- Potential impact assessment
- Any suggested fix (optional)

### What to Expect

| Step | Timeline |
|------|----------|
| Acknowledgment | Within **3 business days** |
| Initial assessment | Within **7 business days** |
| Fix target | Within **90 days** of report |
| Public disclosure | After fix is released (coordinated with reporter) |

We will keep you informed of progress and coordinate disclosure timing with you.

### Our Commitments

- We will **not** take legal action against good-faith security researchers
- We will handle your report confidentially
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will provide progress updates as we work toward a fix

### Reporter Guidelines

- Do not access or modify data belonging to other users
- Do not run automated scanners against production without permission
- Do not exploit vulnerabilities beyond what is necessary for a proof of concept
- Do not disclose the vulnerability publicly before we have released a fix
- Make a good faith effort to avoid disrupting the service

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | Yes |
| Older commits | No |

## Out of Scope

The following are generally not considered vulnerabilities:

- Clickjacking on pages with no sensitive actions
- CSRF on logout or other non-state-changing endpoints
- Missing non-critical HTTP headers on non-sensitive pages
- Content spoofing without a demonstrable attack vector
- Rate limiting thresholds (unless bypass is demonstrated)
- Denial of service attacks
- Social engineering of maintainers or users
- Issues in dependencies without a demonstrated exploit path in AgentXchange

## Security Features

AgentXchange includes several security measures:

- Row Level Security (RLS) on every database table
- Rate limiting on all API routes (Redis-backed with conservative in-memory fallback)
- Feature toggles with fail-closed defaults
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Zod validation on all API inputs
- Gitleaks secret scanning in CI
- Pinned GitHub Actions (SHA-based)
- Sanitized error messages (no internal details in 5xx responses)
