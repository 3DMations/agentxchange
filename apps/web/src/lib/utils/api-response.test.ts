import { describe, it, expect } from 'vitest'
import { apiSuccess, apiError } from './api-response'

describe('apiSuccess', () => {
  it('returns data with null error', async () => {
    const res = apiSuccess({ id: '1', name: 'test' })
    const json = await res.json()
    expect(json.data).toEqual({ id: '1', name: 'test' })
    expect(json.error).toBeNull()
    expect(json.meta).toBeDefined()
  })

  it('includes meta when provided', async () => {
    const res = apiSuccess([1, 2, 3], { cursor_next: 'abc', total: 100 })
    const json = await res.json()
    expect(json.data).toEqual([1, 2, 3])
    expect(json.meta.cursor_next).toBe('abc')
    expect(json.meta.total).toBe(100)
  })

  it('handles null data', async () => {
    const res = apiSuccess(null)
    const json = await res.json()
    expect(json.data).toBeNull()
    expect(json.error).toBeNull()
  })

  it('handles empty meta with undefined fields', async () => {
    const res = apiSuccess('hello')
    const json = await res.json()
    expect(json.meta).toBeDefined()
    expect(json.meta.cursor_next).toBeUndefined()
    expect(json.meta.total).toBeUndefined()
    expect(json.meta.filters_applied).toBeUndefined()
  })

  it('includes filters_applied in meta', async () => {
    const res = apiSuccess([], { filters_applied: { status: 'open' } })
    const json = await res.json()
    expect(json.meta.filters_applied).toEqual({ status: 'open' })
  })

  it('returns 200 status by default', () => {
    const res = apiSuccess({ ok: true })
    expect(res.status).toBe(200)
  })

  it('handles array data', async () => {
    const res = apiSuccess([{ a: 1 }, { a: 2 }])
    const json = await res.json()
    expect(json.data).toHaveLength(2)
  })

  it('handles empty object data', async () => {
    const res = apiSuccess({})
    const json = await res.json()
    expect(json.data).toEqual({})
  })
})

describe('apiError', () => {
  it('returns error with null data', async () => {
    const res = apiError('NOT_FOUND', 'Resource not found', 404)
    const json = await res.json()
    expect(json.data).toBeNull()
    expect(json.error.code).toBe('NOT_FOUND')
    expect(json.error.message).toBe('Resource not found')
    expect(res.status).toBe(404)
  })

  it('includes details when provided', async () => {
    const res = apiError('VALIDATION_ERROR', 'Invalid', 400, { field: 'email' })
    const json = await res.json()
    expect(json.error.details).toEqual({ field: 'email' })
  })

  it('returns correct HTTP status codes', () => {
    expect(apiError('A', 'B', 400).status).toBe(400)
    expect(apiError('A', 'B', 401).status).toBe(401)
    expect(apiError('A', 'B', 403).status).toBe(403)
    expect(apiError('A', 'B', 500).status).toBe(500)
  })

  it('has empty meta object', async () => {
    const res = apiError('ERR', 'fail', 500)
    const json = await res.json()
    expect(json.meta).toEqual({})
  })

  it('details is undefined when not provided', async () => {
    const res = apiError('ERR', 'fail', 500)
    const json = await res.json()
    expect(json.error.details).toBeUndefined()
  })
})
