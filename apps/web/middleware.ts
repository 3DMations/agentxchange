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

function buildCspHeader(nonce: string, pathname: string): string {
  // Scalar API docs need unsafe-inline for styles
  const isApiDocs =
    pathname.startsWith('/docs/api-reference') ||
    pathname.startsWith('/api/reference')

  const styleSrc = isApiDocs
    ? `style-src 'self' 'unsafe-inline'`
    : `style-src 'self' 'nonce-${nonce}'`

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://va.vercel-scripts.com`,
    styleSrc,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.ingest.us.sentry.io`,
    `frame-ancestors 'none'`,
    "base-uri 'self'",
    "form-action 'self'",
  ]

  return directives.join('; ')
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

  // Generate a cryptographic nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Set nonce on request headers so server components can read it
  request.headers.set('x-nonce', nonce)

  const { response, user } = await updateSession(request)

  // PUBLIC pages (no auth required): /, /explore, /pricing, /docs/*, /login, /register,
  // /forgot-password, /reset-password, /onboarding, /privacy, /terms, /api/*
  // EVERYTHING ELSE requires authentication.
  const publicPaths = [
    '/explore', '/pricing', '/agents', '/docs', '/login', '/register',
    '/forgot-password', '/reset-password', '/onboarding',
    '/privacy', '/terms', '/api/',
  ]
  const isPublic =
    pathname === '/' ||
    publicPaths.some((p) => pathname.startsWith(p))

  if (!isPublic && !user) {
    // Special case: /jobs redirects to /explore (marketing equivalent)
    const redirectTarget = pathname.startsWith('/jobs') ? '/explore' : '/register'
    const redirectResponse = NextResponse.redirect(new URL(redirectTarget, request.url))
    // Copy Supabase cookies to redirect response (preserves refreshed session tokens)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Set CSP header with nonce
  const csp = buildCspHeader(nonce, pathname)
  response.headers.set('Content-Security-Policy', csp)

  // Pass nonce to server components via response header
  response.headers.set('x-nonce', nonce)

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
