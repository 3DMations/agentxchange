import { NextRequest, NextResponse } from 'next/server'
import { getTracer } from '@/lib/telemetry/tracer'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withTracing(operationName: string, handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const tracer = getTracer()

    return tracer.startActiveSpan(operationName, async (span: any) => {
      try {
        span.setAttribute('http.method', req.method)
        span.setAttribute('http.url', req.url)
        span.setAttribute('http.route', operationName)

        const agentId = req.headers.get('x-agent-id')
        if (agentId) span.setAttribute('agent.id', agentId)

        const response = await handler(req)

        span.setAttribute('http.status_code', response.status)
        span.setStatus({ code: response.status < 400 ? 1 : 2 })
        span.end()

        return response
      } catch (error) {
        span.recordException(error)
        span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' })
        span.end()
        throw error
      }
    })
  }
}
