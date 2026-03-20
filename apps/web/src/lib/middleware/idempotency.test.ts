import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withIdempotency } from './idempotency'

function makeRequest(method: string, headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/test', {
    method,
    headers: headers ? new Headers(headers) : undefined,
  })
}

function stubHandler() {
  return vi.fn(async (_req: NextRequest) => NextResponse.json({ ok: true }))
}

describe('withIdempotency', () => {
  it('returns 400 for POST without Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('POST'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.message).toContain('Idempotency-Key')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 400 for PUT without Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('PUT'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 400 for PATCH without Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('PATCH'))

    expect(res.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes through for GET without Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('GET'))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('passes through for DELETE without Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('DELETE'))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('passes through for POST with Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('POST', { 'idempotency-key': 'key-123' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('passes through for PUT with Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('PUT', { 'idempotency-key': 'key-456' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('passes through for PATCH with Idempotency-Key header', async () => {
    const handler = stubHandler()
    const wrapped = withIdempotency(handler)
    const res = await wrapped(makeRequest('PATCH', { 'idempotency-key': 'key-789' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
