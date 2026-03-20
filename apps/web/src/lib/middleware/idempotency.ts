import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withIdempotency(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const idempotencyKey = req.headers.get('idempotency-key')
      if (!idempotencyKey) {
        return apiError('VALIDATION_ERROR', 'Idempotency-Key header is required for write operations', 400)
      }
    }
    return handler(req)
  }
}
