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

## Other Deferred Ideas

_(Add future ideas here as they come up)_

---

*Last updated: 2026-03-27*
