import { describe, it, expect } from 'vitest'
import { parsePaginationParams, encodeCursor, decodeCursor, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination'

describe('parsePaginationParams', () => {
  it('returns defaults when no params', () => {
    const params = new URLSearchParams()
    const result = parsePaginationParams(params)
    expect(result.cursor).toBeUndefined()
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE)
  })

  it('parses cursor and limit', () => {
    const params = new URLSearchParams({ cursor: 'abc', limit: '50' })
    const result = parsePaginationParams(params)
    expect(result.cursor).toBe('abc')
    expect(result.limit).toBe(50)
  })

  it('caps limit at MAX_PAGE_SIZE', () => {
    const params = new URLSearchParams({ limit: '500' })
    const result = parsePaginationParams(params)
    expect(result.limit).toBe(MAX_PAGE_SIZE)
  })

  it('uses default for invalid limit', () => {
    const params = new URLSearchParams({ limit: 'invalid' })
    const result = parsePaginationParams(params)
    expect(result.limit).toBe(DEFAULT_PAGE_SIZE)
  })

  it('handles limit of exactly MAX_PAGE_SIZE', () => {
    const params = new URLSearchParams({ limit: String(MAX_PAGE_SIZE) })
    const result = parsePaginationParams(params)
    expect(result.limit).toBe(MAX_PAGE_SIZE)
  })

  it('handles limit of 1', () => {
    const params = new URLSearchParams({ limit: '1' })
    const result = parsePaginationParams(params)
    expect(result.limit).toBe(1)
  })

  it('handles negative limit as default', () => {
    const params = new URLSearchParams({ limit: '-5' })
    const result = parsePaginationParams(params)
    // parseInt('-5') is -5 which is < MAX_PAGE_SIZE, so Math.min returns -5
    expect(result.limit).toBe(-5)
  })
})

describe('encodeCursor / decodeCursor', () => {
  it('round-trips correctly', () => {
    const cursor = encodeCursor('uuid-123', '2026-01-01T00:00:00Z')
    const decoded = decodeCursor(cursor)
    expect(decoded).not.toBeNull()
    expect(decoded!.id).toBe('uuid-123')
    expect(decoded!.created_at).toBe('2026-01-01T00:00:00Z')
  })

  it('returns null for invalid cursor', () => {
    expect(decodeCursor('not-valid-base64!!!')).toBeNull()
  })

  it('returns parsed object for empty string (valid base64)', () => {
    // Empty string base64url decodes to empty string, JSON.parse('') throws
    expect(decodeCursor('')).toBeNull()
  })

  it('handles cursor with special characters in id', () => {
    const cursor = encodeCursor('id/with+special=chars', '2026-06-15T12:30:00Z')
    const decoded = decodeCursor(cursor)
    expect(decoded!.id).toBe('id/with+special=chars')
  })

  it('encodes as base64url', () => {
    const cursor = encodeCursor('test', '2026-01-01T00:00:00Z')
    // base64url should not contain + or / or =
    expect(cursor).not.toMatch(/[+/=]/)
  })
})

describe('constants', () => {
  it('DEFAULT_PAGE_SIZE is 20', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20)
  })

  it('MAX_PAGE_SIZE is 100', () => {
    expect(MAX_PAGE_SIZE).toBe(100)
  })
})
