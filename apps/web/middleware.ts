import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS || ''
  if (!allowedOrigins) return {}

  const origin = request.headers.get('origin') || ''
  const origins = allowedOrigins.split(',').map((o) => o.trim())

  // Check if the request origin is in the allowed list, or if wildcard is set
  if (origins.includes('*') || origins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origins.includes('*') ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key, X-Api-Key',
      'Access-Control-Max-Age': '86400',
    }
  }

  return {}
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS preflight for API routes
  if (pathname.startsWith('/api/v1') && request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(request)
    if (Object.keys(corsHeaders).length > 0) {
      return new NextResponse(null, { status: 204, headers: corsHeaders })
    }
    return new NextResponse(null, { status: 204 })
  }

  const response = await updateSession(request)

  // Add CORS headers to API responses
  if (pathname.startsWith('/api/v1')) {
    const corsHeaders = getCorsHeaders(request)
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
