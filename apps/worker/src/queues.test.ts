import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  QUEUE_NAMES,
  SCHEDULES,
  DLQ_SUFFIX,
  DEFAULT_JOB_OPTIONS,
  WEBHOOK_JOB_OPTIONS,
  getRedisConnection,
  moveToDeadLetterQueue,
} from './queues.js'

describe('Queue Definitions', () => {
  it('defines all expected queue names', () => {
    expect(QUEUE_NAMES.WALLET_RECONCILIATION).toBe('wallet-reconciliation')
    expect(QUEUE_NAMES.TOOL_RESCAN).toBe('tool-rescan')
    expect(QUEUE_NAMES.SWARM_DESCRIPTION).toBe('swarm-description')
    expect(QUEUE_NAMES.REPUTATION_BATCH_RECALC).toBe('reputation-batch-recalc')
    expect(QUEUE_NAMES.STALE_ESCROW_CHECK).toBe('stale-escrow-check')
    expect(QUEUE_NAMES.WEBHOOK_DISPATCH).toBe('webhook-dispatch')
  })

  it('has schedules for recurring jobs', () => {
    expect(SCHEDULES[QUEUE_NAMES.WALLET_RECONCILIATION]).toBe('*/15 * * * *')
    expect(SCHEDULES[QUEUE_NAMES.TOOL_RESCAN]).toBe('0 2 * * *')
    expect(SCHEDULES[QUEUE_NAMES.REPUTATION_BATCH_RECALC]).toBe('0 * * * *')
    expect(SCHEDULES[QUEUE_NAMES.STALE_ESCROW_CHECK]).toBe('*/30 * * * *')
  })

  it('does not have schedules for on-demand queues', () => {
    expect((SCHEDULES as any)[QUEUE_NAMES.WEBHOOK_DISPATCH]).toBeUndefined()
    expect((SCHEDULES as any)[QUEUE_NAMES.SWARM_DESCRIPTION]).toBeUndefined()
  })

  it('webhook job options have more retries than default', () => {
    expect(WEBHOOK_JOB_OPTIONS.attempts).toBeGreaterThan(DEFAULT_JOB_OPTIONS.attempts)
  })

  it('default options use exponential backoff', () => {
    expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential')
    expect(WEBHOOK_JOB_OPTIONS.backoff.type).toBe('exponential')
  })
})

describe('getRedisConnection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  it('parses REDIS_URL correctly', () => {
    process.env.REDIS_URL = 'redis://user:pass@myhost:6380'
    const conn = getRedisConnection()
    expect(conn.host).toBe('myhost')
    expect(conn.port).toBe(6380)
    expect(conn.password).toBe('pass')
    expect(conn.username).toBe('user')
  })

  it('parses rediss:// URL with TLS', () => {
    process.env.REDIS_URL = 'rediss://default:secret@redis.example.com:6379'
    const conn = getRedisConnection()
    expect(conn.host).toBe('redis.example.com')
    expect(conn.tls).toEqual({})
  })

  it('falls back to individual env vars', () => {
    delete process.env.REDIS_URL
    process.env.REDIS_HOST = 'localhost'
    process.env.REDIS_PORT = '6381'
    process.env.REDIS_PASSWORD = 'mypass'
    const conn = getRedisConnection()
    expect(conn.host).toBe('localhost')
    expect(conn.port).toBe(6381)
    expect(conn.password).toBe('mypass')
  })

  it('uses defaults when no env vars set', () => {
    delete process.env.REDIS_URL
    delete process.env.REDIS_HOST
    delete process.env.REDIS_PORT
    delete process.env.REDIS_PASSWORD
    const conn = getRedisConnection()
    expect(conn.host).toBe('127.0.0.1')
    expect(conn.port).toBe(6379)
  })
})

describe('moveToDeadLetterQueue', () => {
  it('adds job to DLQ with metadata', async () => {
    const addMock = vi.fn().mockResolvedValue(undefined)
    const dlqs = new Map()
    dlqs.set('test-queue', { add: addMock })

    await moveToDeadLetterQueue(dlqs as any, 'test-queue', { foo: 'bar' }, 'some error')

    expect(addMock).toHaveBeenCalledWith('dead-letter', expect.objectContaining({
      originalQueue: 'test-queue',
      data: { foo: 'bar' },
      failedReason: 'some error',
      movedAt: expect.any(String),
    }))
  })

  it('handles missing DLQ gracefully', async () => {
    const dlqs = new Map()
    // Should not throw
    await moveToDeadLetterQueue(dlqs as any, 'nonexistent', {}, 'error')
  })
})
