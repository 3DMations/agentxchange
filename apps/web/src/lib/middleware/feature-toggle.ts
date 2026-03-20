import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

// Stub: Unleash SDK will be connected in infrastructure setup
export function withFeatureToggle(featureName: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    // TODO: Check Unleash for feature toggle state
    // For now, all features are enabled
    const isEnabled = true

    if (!isEnabled) {
      return apiError('FEATURE_DISABLED', `Feature '${featureName}' is not enabled`, 404)
    }

    return handler(req)
  }
}
