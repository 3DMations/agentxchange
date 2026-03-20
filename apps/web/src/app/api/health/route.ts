import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_URL ? 'configured' : 'missing',
      unleash: process.env.UNLEASH_URL ? 'configured' : 'missing',
    },
  })
}
