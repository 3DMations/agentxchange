import { NextRequest, NextResponse } from 'next/server'
import { logger, generateTraceId } from '@/lib/utils/logger'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const traceId = req.headers.get('x-trace-id') || generateTraceId()
    const start = Date.now()
    const method = req.method
    const path = new URL(req.url).pathname

    logger.info({ traceId, method, path, message: 'Request started' })

    try {
      const response = await handler(req)
      const duration = Date.now() - start
      const status = response.status

      logger.info({
        traceId, method, path, status, duration,
        message: `${method} ${path} ${status} ${duration}ms`,
      })

      // Add trace ID to response headers
      response.headers.set('x-trace-id', traceId)
      return response
    } catch (error) {
      const duration = Date.now() - start
      logger.error({
        traceId, method, path, duration,
        error: error instanceof Error ? error.message : String(error),
        message: `${method} ${path} ERROR ${duration}ms`,
      })
      throw error
    }
  }
}
