import { describe, it, expect } from 'vitest'
import { escrowLockSchema, escrowReleaseSchema, refundSchema, ledgerQuerySchema } from './wallet.schema'

describe('escrowLockSchema', () => {
  it('accepts valid input', () => {
    expect(escrowLockSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000', amount: 100 }).success).toBe(true)
  })

  it('rejects non-uuid job_id', () => {
    expect(escrowLockSchema.safeParse({ job_id: 'not-uuid', amount: 100 }).success).toBe(false)
  })

  it('rejects zero amount', () => {
    expect(escrowLockSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000', amount: 0 }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(escrowLockSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000', amount: -10 }).success).toBe(false)
  })

  it('rejects non-integer amount', () => {
    expect(escrowLockSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000', amount: 10.5 }).success).toBe(false)
  })

  it('rejects missing job_id', () => {
    expect(escrowLockSchema.safeParse({ amount: 100 }).success).toBe(false)
  })

  it('rejects missing amount', () => {
    expect(escrowLockSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(false)
  })
})

describe('escrowReleaseSchema', () => {
  it('accepts valid uuid', () => {
    expect(escrowReleaseSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-uuid', () => {
    expect(escrowReleaseSchema.safeParse({ job_id: 'not-uuid' }).success).toBe(false)
  })

  it('rejects missing job_id', () => {
    expect(escrowReleaseSchema.safeParse({}).success).toBe(false)
  })
})

describe('refundSchema', () => {
  it('accepts valid uuid', () => {
    expect(refundSchema.safeParse({ job_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-uuid', () => {
    expect(refundSchema.safeParse({ job_id: 'bad' }).success).toBe(false)
  })

  it('rejects missing job_id', () => {
    expect(refundSchema.safeParse({}).success).toBe(false)
  })
})

describe('ledgerQuerySchema', () => {
  it('accepts empty params', () => {
    expect(ledgerQuerySchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid type filter', () => {
    expect(ledgerQuerySchema.safeParse({ type: 'credit' }).success).toBe(true)
  })

  it('rejects invalid type', () => {
    expect(ledgerQuerySchema.safeParse({ type: 'invalid' }).success).toBe(false)
  })

  it('defaults limit to 20', () => {
    const result = ledgerQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(20)
  })

  it('accepts all valid types', () => {
    const types = ['credit', 'debit', 'escrow_lock', 'escrow_release', 'refund', 'platform_fee', 'starter_bonus']
    for (const type of types) {
      expect(ledgerQuerySchema.safeParse({ type }).success).toBe(true)
    }
  })

  it('accepts date filters', () => {
    const result = ledgerQuerySchema.safeParse({
      from_date: '2026-01-01T00:00:00Z',
      to_date: '2026-12-31T23:59:59Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid date format', () => {
    expect(ledgerQuerySchema.safeParse({ from_date: 'not-a-date' }).success).toBe(false)
  })

  it('rejects limit over 100', () => {
    expect(ledgerQuerySchema.safeParse({ limit: '200' }).success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = ledgerQuerySchema.safeParse({ limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })

  it('accepts cursor', () => {
    const result = ledgerQuerySchema.safeParse({ cursor: 'some-cursor-value' })
    expect(result.success).toBe(true)
  })
})
