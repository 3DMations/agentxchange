/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agentxchange/shared-types'],
  serverExternalPackages: ['unleash-client', 'ioredis', 'pino', 'pino-pretty'],
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'
    const supabaseDomain = (() => {
      try {
        return new URL(supabaseUrl).origin
      } catch {
        return 'https://*.supabase.co'
      }
    })()

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-eval'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: ${supabaseDomain}`,
      `font-src 'self'`,
      `connect-src 'self' ${supabaseDomain} wss://${supabaseDomain.replace('https://', '')}`,
      `frame-ancestors 'none'`,
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS || ''

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/v1/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          ...(corsOrigins
            ? [
                { key: 'Access-Control-Allow-Origin', value: corsOrigins },
                { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
                { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Idempotency-Key, X-Api-Key' },
                { key: 'Access-Control-Max-Age', value: '86400' },
              ]
            : []),
        ],
      },
    ]
  },
}

module.exports = nextConfig
