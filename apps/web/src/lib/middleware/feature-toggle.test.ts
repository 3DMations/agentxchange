import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// We need to re-import fresh each test to reset module-level state
// But at minimum we can test the public API behavior

function makeRequest() {
  return new NextRequest('http://localhost/api/test', { method: 'GET' })
}

function stubHandler() {
  return vi.fn(async (_req: NextRequest) => NextResponse.json({ ok: true }))
}

describe('withFeatureToggle', () => {
  beforeEach(() => {
    vi.resetModules()
    // Ensure UNLEASH_URL is not set by default
    delete process.env.UNLEASH_URL
    delete process.env.UNLEASH_API_KEY
  })

  it('defaults to enabled and calls handler when UNLEASH_URL is not set', async () => {
    const { withFeatureToggle } = await import('./feature-toggle')

    const handler = stubHandler()
    const wrapped = withFeatureToggle('some-feature', handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls handler when feature is enabled (no unleash = default enabled)', async () => {
    const { withFeatureToggle } = await import('./feature-toggle')

    const handler = stubHandler()
    const wrapped = withFeatureToggle('another-feature', handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('passes the original request to the handler', async () => {
    const { withFeatureToggle } = await import('./feature-toggle')

    const handler = vi.fn(async (req: NextRequest) => {
      return NextResponse.json({ url: req.url })
    })
    const req = makeRequest()
    const wrapped = withFeatureToggle('test-feature', handler)
    await wrapped(req)

    expect(handler).toHaveBeenCalledTimes(1)
    const passedReq = handler.mock.calls[0][0]
    expect(passedReq.url).toBe(req.url)
  })
})
