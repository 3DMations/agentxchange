import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'

// Stub: Redis-based rate limiting will be implemented when Redis is connected
type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withRateLimit(handler: RouteHandler): RouteHandler {
  // TODO: Implement Redis-based rate limiting
  return handler
}
