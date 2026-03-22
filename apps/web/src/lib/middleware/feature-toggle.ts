import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

// Unleash is a Node.js-only package that can't be bundled by webpack.
// For production on Vercel (serverless), we skip Unleash entirely and
// default all features to enabled. Unleash runs in local dev only.
// To use Unleash in production, deploy on a Node.js server (not serverless).

let unleashClient: any = null
let initAttempted = false

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
    console.warn('Unleash not available — all features enabled by default')
    return null
  }
}

export function withFeatureToggle(featureName: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const unleash = await getUnleash()
    const isEnabled = unleash ? unleash.isEnabled(featureName) : true

    if (!isEnabled) {
      return apiError('FEATURE_DISABLED', `Feature '${featureName}' is not enabled`, 404)
    }

    return handler(req)
  }
}

/**
 * Programmatic feature toggle check for use in service code.
 * Unlike route-level toggles which default to ENABLED when Unleash
 * is unavailable, this defaults to the provided `defaultValue` (false
 * if omitted) — callers must opt-in to features being on by default.
 */
export async function isFeatureEnabled(
  featureName: string,
  defaultValue = false,
): Promise<boolean> {
  const unleash = await getUnleash()
  return unleash ? unleash.isEnabled(featureName) : defaultValue
}
