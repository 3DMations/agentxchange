import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'
import { createServiceLogger } from '@/lib/utils/logger'

const log = createServiceLogger('idempotency')

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

const IDEMPOTENCY_TTL_SECONDS = 86400 // 24 hours

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
    log.warn('Redis not available — idempotency caching disabled')
    return null
  }
}

interface CachedResponse {
  status: number
  body: string
  headers: Record<string, string>
}

export function withIdempotency(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    // Only enforce idempotency on write methods
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return handler(req)
    }

    const idempotencyKey = req.headers.get('idempotency-key')
    if (!idempotencyKey) {
      return apiError('VALIDATION_ERROR', 'Idempotency-Key header is required for write operations', 400)
    }

    const redis = await getRedis()
    if (!redis) {
      // Fail open: execute handler without idempotency protection
      log.warn({ idempotencyKey }, 'Redis unavailable — executing without idempotency check')
      return handler(req)
    }

    const cacheKey = `idempotency:${idempotencyKey}`

    try {
      // Check for a cached response
      const cached = await redis.get(cacheKey)
      if (cached) {
        const parsed: CachedResponse = JSON.parse(cached)
        log.debug({ idempotencyKey }, 'Returning cached idempotent response')
        const response = new NextResponse(parsed.body, { status: parsed.status })
        for (const [key, value] of Object.entries(parsed.headers)) {
          response.headers.set(key, value)
        }
        response.headers.set('X-Idempotent-Replay', 'true')
        return response
      }

      // Execute the handler
      const response = await handler(req)

      // Cache the response
      const headersObj: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headersObj[key] = value
      })

      const body = await response.clone().text()

      const toCache: CachedResponse = {
        status: response.status,
        body,
        headers: headersObj,
      }

      await redis.set(cacheKey, JSON.stringify(toCache), 'EX', IDEMPOTENCY_TTL_SECONDS)

      return response
    } catch (err) {
      // If Redis errors mid-operation, fail open
      log.warn({ idempotencyKey, err }, 'Redis error during idempotency check — executing handler')
      return handler(req)
    }
  }
}
