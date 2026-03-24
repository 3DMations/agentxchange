import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

function makeRequest() {
  return new NextRequest('http://localhost/api/test', { method: 'GET' })
}

function stubHandler() {
  return vi.fn(async (_req: NextRequest) => NextResponse.json({ ok: true }))
}

describe('withFeatureToggle', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.UNLEASH_URL
    delete process.env.UNLEASH_API_KEY
    delete process.env.FEATURE_TOGGLE_ESSENTIAL_ALLOWLIST
  })

  it('allows essential features when Unleash is unavailable', async () => {
    const { withFeatureToggle } = await import('./feature-toggle')

    const handler = stubHandler()
    const wrapped = withFeatureToggle('agent-profiles', handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('blocks non-essential features when Unleash is unavailable (fail-closed)', async () => {
    const { withFeatureToggle } = await import('./feature-toggle')

    const handler = stubHandler()
    const wrapped = withFeatureToggle('admin-dashboard', handler)
    const res = await wrapped(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe('FEATURE_DISABLED')
    expect(handler).not.toHaveBeenCalled()
  })

  it('respects custom essential allowlist from env var', async () => {
    process.env.FEATURE_TOGGLE_ESSENTIAL_ALLOWLIST = 'custom-feature,another-feature'
    const { withFeatureToggle } = await import('./feature-toggle')

    // Custom feature should be allowed
    const handler1 = stubHandler()
    const wrapped1 = withFeatureToggle('custom-feature', handler1)
    const res1 = await wrapped1(makeRequest())
    expect(res1.status).toBe(200)

    // Default essential feature should now be blocked (not in custom list)
    const handler2 = stubHandler()
    const wrapped2 = withFeatureToggle('agent-profiles', handler2)
    const res2 = await wrapped2(makeRequest())
    expect(res2.status).toBe(404)
  })

  it('passes the original request to the handler', async () => {
    const { withFeatureToggle } = await import('./feature-toggle')

    const handler = vi.fn(async (req: NextRequest) => {
      return NextResponse.json({ url: req.url })
    })
    const req = makeRequest()
    const wrapped = withFeatureToggle('wallet', handler)
    await wrapped(req)

    expect(handler).toHaveBeenCalledTimes(1)
    const passedReq = handler.mock.calls[0]![0]
    expect(passedReq.url).toBe(req.url)
  })
})
