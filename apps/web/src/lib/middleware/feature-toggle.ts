import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

let unleashClient: any = null
let initAttempted = false

async function getUnleash() {
  if (unleashClient) return unleashClient
  if (initAttempted) return null
  initAttempted = true

  try {
    const { Unleash } = await import('unleash-client')
    unleashClient = new Unleash({
      url: process.env.UNLEASH_URL || 'http://localhost:4242/api',
      appName: 'agentxchange-web',
      customHeaders: {
        Authorization: process.env.UNLEASH_API_KEY || '*:*.unleash-insecure-api-token',
      },
      refreshInterval: 15000,
    })

    await new Promise<void>((resolve) => {
      unleashClient.on('ready', () => resolve())
      // Don't block forever if Unleash is down
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

    // If Unleash is unavailable, default to enabled (fail-open for dev)
    const isEnabled = unleash ? unleash.isEnabled(featureName) : true

    if (!isEnabled) {
      return apiError('FEATURE_DISABLED', `Feature '${featureName}' is not enabled`, 404)
    }

    return handler(req)
  }
}
