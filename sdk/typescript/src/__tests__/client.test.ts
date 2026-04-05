import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpClient } from '../client.js'

describe('HttpClient', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  function makeClient(overrides = {}) {
    return new HttpClient({ baseUrl: 'https://api.test.com', ...overrides })
  }

  function mockResponse(data: unknown, status = 200) {
    return { json: () => Promise.resolve(data), status }
  }

  // ── Construction ──
  it('strips trailing slash from baseUrl', async () => {
    const client = makeClient({ baseUrl: 'https://api.test.com/' })
    mockFetch.mockResolvedValue(mockResponse({ data: null, error: null, meta: {} }))
    await client.get('/test')
    expect(mockFetch.mock.calls[0]![0]).toBe('https://api.test.com/test')
  })

  // ── GET ──
  it('makes GET requests with query params', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: [1, 2], error: null, meta: {} }))
    const res = await makeClient().get<number[]>('/items', { page: 1, active: true })
    expect(res.data).toEqual([1, 2])
    expect(mockFetch.mock.calls[0]![0]).toContain('page=1')
    expect(mockFetch.mock.calls[0]![0]).toContain('active=true')
  })

  it('omits undefined query params', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: null, error: null, meta: {} }))
    await makeClient().get('/items', { page: 1, filter: undefined })
    const url = mockFetch.mock.calls[0]![0] as string
    expect(url).toContain('page=1')
    expect(url).not.toContain('filter')
  })

  // ── POST ──
  it('makes POST requests with JSON body', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: { id: '1' }, error: null, meta: {} }))
    const res = await makeClient().post('/items', { name: 'test' })
    expect(res.data).toEqual({ id: '1' })
    const opts = mockFetch.mock.calls[0]![1] as RequestInit
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ name: 'test' })
  })

  // ── PUT ──
  it('makes PUT requests', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: { updated: true }, error: null, meta: {} }))
    await makeClient().put('/items/1', { name: 'updated' })
    const opts = mockFetch.mock.calls[0]![1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  // ── DELETE ──
  it('makes DELETE requests', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: { deleted: true }, error: null, meta: {} }))
    await makeClient().delete('/items/1')
    const opts = mockFetch.mock.calls[0]![1] as RequestInit
    expect(opts.method).toBe('DELETE')
  })

  // ── Authentication ──
  it('includes Bearer token when accessToken is set', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: null, error: null, meta: {} }))
    await makeClient({ accessToken: 'my-jwt' }).get('/test')
    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-jwt')
  })

  it('includes x-api-key when apiKey is set', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: null, error: null, meta: {} }))
    await makeClient({ apiKey: 'key-123' }).get('/test')
    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(headers['x-api-key']).toBe('key-123')
  })

  // ── Idempotency ──
  it('adds Idempotency-Key header on write operations', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: null, error: null, meta: {} }))
    await makeClient().post('/items', { name: 'test' })
    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(headers['Idempotency-Key']).toMatch(/^sdk-/)
  })

  it('does not add Idempotency-Key on GET', async () => {
    mockFetch.mockResolvedValue(mockResponse({ data: null, error: null, meta: {} }))
    await makeClient().get('/items')
    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(headers['Idempotency-Key']).toBeUndefined()
  })

  // ── Retry ──
  it('retries on 5xx errors', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({ data: null, error: { code: 'INTERNAL', message: 'fail' }, meta: {} }, 500))
      .mockResolvedValueOnce(mockResponse({ data: 'ok', error: null, meta: {} }, 200))
    const res = await makeClient({ retries: 1 }).get('/test')
    expect(res.data).toBe('ok')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('retries on network errors', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(mockResponse({ data: 'recovered', error: null, meta: {} }))
    const res = await makeClient({ retries: 1 }).get('/test')
    expect(res.data).toBe('recovered')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns NETWORK_ERROR after exhausting retries', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const res = await makeClient({ retries: 0 }).get('/test')
    expect(res.error?.code).toBe('NETWORK_ERROR')
    expect(res.data).toBeNull()
  })
})
