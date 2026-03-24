import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'
import { createServiceLogger } from '@/lib/utils/logger'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

const log = createServiceLogger('rate-limit')

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
    log.warn({ message: 'Redis not available — using conservative in-memory rate limiting' })
    return null
  }
}

const DEFAULT_WINDOW_MS = 60000 // 1 minute
const DEFAULT_MAX_REQUESTS = 60 // 60 requests per minute

// In-memory fallback is more conservative (50% of Redis limits) since it's
// per-instance rather than global. This ensures rate limiting still provides
// meaningful protection when Redis is unavailable.
const MEMORY_FALLBACK_RATIO = 0.5

// In-memory fallback when Redis is unavailable (e.g. Vercel serverless).
// Note: each serverless instance has its own Map, so limits are per-instance
// rather than global — but this is still better than no rate limiting at all.
const memoryStore = new Map<string, { count: number; resetAt: number }>()

// Periodically clean up expired entries to prevent memory leaks
let lastCleanup = Date.now()
const CLEANUP_INTERVAL_MS = 60000

function cleanupMemoryStore() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt < now) memoryStore.delete(key)
  }
}

function checkMemoryRateLimit(
  identifier: string,
  path: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; current: number } {
  const key = `${identifier}:${path}`
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, current: 1 }
  }

  entry.count++
  return { allowed: entry.count <= maxRequests, current: entry.count }
}

export function withRateLimit(handler: RouteHandler, maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS): RouteHandler {
  return async (req: NextRequest) => {
    const identifier = req.headers.get('x-agent-id') || req.headers.get('x-forwarded-for') || 'anonymous'
    const path = new URL(req.url).pathname

    const redis = await getRedis()

    if (!redis) {
      // Fall back to conservative in-memory rate limiting when Redis is unavailable
      cleanupMemoryStore()
      const conservativeMax = Math.max(1, Math.floor(maxRequests * MEMORY_FALLBACK_RATIO))
      const { allowed, current } = checkMemoryRateLimit(identifier, path, conservativeMax, windowMs)
      if (!allowed) {
        return apiError('RATE_LIMITED', 'Too many requests', 429, {
          retry_after_ms: windowMs,
          limit: conservativeMax,
          remaining: 0,
        })
      }
      const response = await handler(req)
      response.headers.set('X-RateLimit-Limit', String(conservativeMax))
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, conservativeMax - current)))
      return response
    }

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
    } catch (err) {
      // If Redis errors mid-request, fall back to conservative in-memory rate limiting
      log.warn({ data: { path }, message: 'Redis error mid-request — falling back to in-memory rate limiting' })
      cleanupMemoryStore()
      const conservativeMax = Math.max(1, Math.floor(maxRequests * MEMORY_FALLBACK_RATIO))
      const { allowed, current } = checkMemoryRateLimit(identifier, path, conservativeMax, windowMs)
      if (!allowed) {
        return apiError('RATE_LIMITED', 'Too many requests', 429, {
          retry_after_ms: windowMs,
          limit: conservativeMax,
          remaining: 0,
        })
      }
      const response = await handler(req)
      response.headers.set('X-RateLimit-Limit', String(conservativeMax))
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, conservativeMax - current)))
      return response
    }
  }
}
