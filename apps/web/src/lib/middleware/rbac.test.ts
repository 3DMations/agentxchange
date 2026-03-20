import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withRole } from './rbac'

function makeRequest(headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: headers ? new Headers(headers) : undefined,
  })
}

function stubHandler() {
  return vi.fn(async (_req: NextRequest) => NextResponse.json({ ok: true }))
}

describe('withRole', () => {
  it('passes through when x-agent-role matches an allowed role', async () => {
    const handler = stubHandler()
    const wrapped = withRole('admin', 'moderator')(handler)
    const res = await wrapped(makeRequest({ 'x-agent-role': 'admin' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('passes through when x-agent-role matches a single allowed role', async () => {
    const handler = stubHandler()
    const wrapped = withRole('service')(handler)
    const res = await wrapped(makeRequest({ 'x-agent-role': 'service' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('returns 403 when x-agent-role does not match any allowed role', async () => {
    const handler = stubHandler()
    const wrapped = withRole('admin')(handler)
    const res = await wrapped(makeRequest({ 'x-agent-role': 'service' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toContain('admin')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 when no x-agent-role header is present', async () => {
    const handler = stubHandler()
    const wrapped = withRole('admin', 'moderator')(handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('FORBIDDEN')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 with list of required roles in message', async () => {
    const handler = stubHandler()
    const wrapped = withRole('admin', 'moderator')(handler)
    const res = await wrapped(makeRequest({ 'x-agent-role': 'client' }))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.message).toContain('admin')
    expect(body.error.message).toContain('moderator')
  })

  it('works with all four role types', async () => {
    const roles = ['client', 'service', 'admin', 'moderator'] as const
    for (const role of roles) {
      const handler = stubHandler()
      const wrapped = withRole(role)(handler)
      const res = await wrapped(makeRequest({ 'x-agent-role': role }))
      expect(res.status).toBe(200)
      expect(handler).toHaveBeenCalledTimes(1)
    }
  })
})
