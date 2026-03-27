import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'
import { createServiceLogger } from '@/lib/utils/logger'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

const log = createServiceLogger('feature-toggle')

// Unleash is a Node.js-only package that can't be bundled by webpack.
// For production on Vercel (serverless), we skip Unleash entirely.
// To use Unleash in production, deploy on a Node.js server (not serverless)
// or connect via Unleash's hosted API / Vercel Edge Config / LaunchDarkly.

let unleashClient: any = null
let initAttempted = false

/**
 * Essential features that remain ENABLED when Unleash is unavailable.
 * All other features default to DISABLED (fail-closed) for security.
 * Configure via FEATURE_TOGGLE_ESSENTIAL_ALLOWLIST env var (comma-separated).
 */
function getEssentialAllowlist(): Set<string> {
  const envList = process.env.FEATURE_TOGGLE_ESSENTIAL_ALLOWLIST
  if (envList) {
    return new Set(envList.split(',').map((s) => s.trim()).filter(Boolean))
  }
  // Default essential features that must work without Unleash.
  // Admin/moderation features remain fail-closed for security.
  return new Set([
    'agent-profiles',
    'agent-registration',
    'agent-search',
    'a2a_protocol',
    'job-exchange',
    'reputation-engine',
    'skill-catalog',
    'tool-registry',
    'ai-tool-registry',
    'wallet-service',
    'webhooks',
    'zones',
  ])
}

async function getUnleash() {
  if (unleashClient) return unleashClient
  if (initAttempted) return null
  initAttempted = true

  if (!process.env.UNLEASH_URL) return null

  try {
    // eval('require') prevents webpack from analyzing this import
    const mod = eval('require')('unleash-client')
    unleashClient = new mod.Unleash({
      url: process.env.UNLEASH_URL,
      appName: 'agentxchange-web',
      customHeaders: {
        Authorization: process.env.UNLEASH_API_KEY || '',
      },
      refreshInterval: 15000,
    })

    await new Promise<void>((resolve) => {
      unleashClient.on('ready', () => resolve())
      setTimeout(() => resolve(), 3000)
    })

    return unleashClient
  } catch {
    log.warn({ message: 'Unleash not available — non-essential features disabled (fail-closed)' })
    return null
  }
}

export function withFeatureToggle(featureName: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const unleash = await getUnleash()

    let isEnabled: boolean
    if (unleash) {
      isEnabled = unleash.isEnabled(featureName)
    } else {
      // Fail-closed: only essential features are enabled when Unleash is unavailable.
      // This prevents admin/moderation/sensitive routes from being accessible without
      // proper toggle evaluation.
      const allowlist = getEssentialAllowlist()
      isEnabled = allowlist.has(featureName)
      if (!isEnabled) {
        log.warn({
          data: { featureName },
          message: `Feature '${featureName}' disabled — Unleash unavailable and not in essential allowlist`,
        })
      }
    }

    if (!isEnabled) {
      return apiError('FEATURE_DISABLED', `Feature '${featureName}' is not enabled`, 404)
    }

    return handler(req)
  }
}

/**
 * Programmatic feature toggle check for use in service code.
 * Defaults to the provided `defaultValue` (false if omitted) when
 * Unleash is unavailable — callers must opt-in to features being on by default.
 */
export async function isFeatureEnabled(
  featureName: string,
  defaultValue = false,
): Promise<boolean> {
  const unleash = await getUnleash()
  return unleash ? unleash.isEnabled(featureName) : defaultValue
}
