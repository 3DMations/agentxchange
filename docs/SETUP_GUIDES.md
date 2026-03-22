# External Service Setup Guides

> Verified setup instructions for external services needed by AgentXchange.
> All instructions verified via web search against official documentation as of March 2026.

## Table of Contents
1. [Sentry Error Tracking](#1-sentry-error-tracking)
2. [Vercel Analytics + Speed Insights](#2-vercel-analytics--speed-insights)
3. [Turborepo Remote Caching](#3-turborepo-remote-caching)
4. [Recommended Monitoring Stack](#4-recommended-monitoring-stack)

---

## 1. Sentry Error Tracking

**Free tier:** 5,000 errors/month, 10,000 transactions/month, 1 user
**Package:** `@sentry/nextjs`
**Source:** [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

### Install

```bash
pnpm --filter @agentxchange/web add @sentry/nextjs
```

### Create Configuration Files

**`apps/web/instrumentation-client.ts`** (browser):
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
});
```

**`apps/web/sentry.server.config.ts`** (Node.js server):
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,
});
```

**`apps/web/sentry.edge.config.ts`** (edge runtime):
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,
});
```

**`apps/web/instrumentation.ts`** (Next.js hook):
```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

**`apps/web/src/app/global-error.tsx`**:
```tsx
"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html><body>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </body></html>
  );
}
```

### Update next.config.js

```js
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = { /* ... existing config ... */ };

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
```

### Environment Variables

```bash
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=sntrys_YOUR_AUTH_TOKEN_HERE
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

Get these from: Sentry dashboard > Project Settings > Client Keys (DSN) and Settings > Auth Tokens.

### Vercel Integration (Recommended)

Install via [Vercel Marketplace - Sentry](https://vercel.com/marketplace/sentry) to auto-configure env vars and deployment notifications.

---

## 2. Vercel Analytics + Speed Insights

**Free tier:** Included on Hobby plan with usage limits
**Packages:** `@vercel/analytics`, `@vercel/speed-insights`
**Source:** [vercel.com/docs/analytics](https://vercel.com/docs/analytics/quickstart)

### Install

```bash
pnpm --filter @agentxchange/web add @vercel/analytics @vercel/speed-insights
```

### Add to Root Layout

Edit `apps/web/src/app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Important:** Import from `@vercel/analytics/next` (not `/react`).

### Enable in Dashboard

1. Vercel dashboard > Select project > **Analytics** > **Enable**
2. Vercel dashboard > Select project > **Speed Insights** > **Enable**

### No env vars or config needed

Packages auto-detect Vercel deployment. Data only tracks in production/preview, not local dev.

---

## 3. Turborepo Remote Caching

**Free tier:** Free on all Vercel plans (including Hobby)
**Source:** [turbo.build/repo/docs/core-concepts/remote-caching](https://turbo.build/repo/docs/core-concepts/remote-caching)

### Local Setup

```bash
# Authenticate with Vercel
npx turbo login

# Link repo to Vercel team
npx turbo link

# Verify (second run should show cache hits)
pnpm turbo build
pnpm turbo build   # Should show "FULL TURBO"
```

### GitHub Actions CI Setup

1. Create a Vercel scoped access token at vercel.com > Account Settings > Tokens
2. Add to GitHub repo:
   - **Secret:** `TURBO_TOKEN` (the access token)
   - **Variable:** `TURBO_TEAM` (your Vercel team slug)

3. Update `.github/workflows/ci.yml`:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

### Vercel Builds

Remote caching is **automatic on Vercel** — no configuration needed. Vercel injects `TURBO_TOKEN` and `TURBO_TEAM` automatically.

### Optimize turbo.json

Add empty `outputs` to lint/type-check tasks:

```json
{
  "lint": { "dependsOn": ["^build"], "outputs": [] },
  "type-check": { "dependsOn": ["^build"], "outputs": [] },
  "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
}
```

---

## 4. Recommended Monitoring Stack

For the AgentXchange stack (Next.js 14 + Supabase + Vercel + Upstash Redis):

| Tool | Purpose | Free Tier | Priority |
|------|---------|-----------|----------|
| **Sentry** | Error tracking + performance | 5K errors/mo | Must-have |
| **Vercel Analytics** | Page views + Web Vitals | Included | Must-have |
| **Vercel Speed Insights** | Core Web Vitals (real user) | Included | Must-have |
| **Turborepo Remote Cache** | CI/CD build speed | Free | Must-have |
| **Axiom** | Structured logs + request tracing | Free tier | Recommended |
| **Upstash Dashboard** | Redis metrics (commands/sec, memory) | Included | Free with Upstash |

### Axiom Setup (Optional)

```bash
pnpm --filter @agentxchange/web add next-axiom
```

Wrap next.config.js with `withAxiom()`. Install via [Vercel Marketplace - Axiom](https://vercel.com/marketplace/axiom).

---

*All instructions verified against official documentation as of March 2026.*
