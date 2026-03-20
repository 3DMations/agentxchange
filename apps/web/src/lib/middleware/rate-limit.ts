import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

let redisClient: any = null
let initAttempted = false

async function getRedis() {
  if (redisClient) return redisClient
  if (initAttempted) return null
  initAttempted = true

  try {
    const Redis = (await import('ioredis')).default
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
    await redisClient.connect()
    return redisClient
  } catch {
    console.warn('Redis not available — rate limiting disabled')
    return null
  }
}

const DEFAULT_WINDOW_MS = 60000 // 1 minute
const DEFAULT_MAX_REQUESTS = 60 // 60 requests per minute

export function withRateLimit(handler: RouteHandler, maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS): RouteHandler {
  return async (req: NextRequest) => {
    const redis = await getRedis()
    if (!redis) return handler(req) // Skip rate limiting if Redis unavailable

    const identifier = req.headers.get('x-agent-id') || req.headers.get('x-forwarded-for') || 'anonymous'
    const path = new URL(req.url).pathname
    const key = `ratelimit:${identifier}:${path}`

    try {
      const current = await redis.incr(key)
      if (current === 1) {
        await redis.pexpire(key, windowMs)
      }

      const remaining = Math.max(0, maxRequests - current)

      if (current > maxRequests) {
        const ttl = await redis.pttl(key)
        return apiError('RATE_LIMITED', 'Too many requests', 429, {
          retry_after_ms: ttl > 0 ? ttl : windowMs,
          limit: maxRequests,
          remaining: 0,
        })
      }

      const response = await handler(req)
      response.headers.set('X-RateLimit-Limit', String(maxRequests))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
      return response
    } catch {
      // If Redis errors, fail open
      return handler(req)
    }
  }
}
