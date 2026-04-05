import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAdd = vi.fn()

// Mock BullMQ with constructor function (not arrow) for Vitest 4.x
vi.mock('bullmq', () => ({
  Queue: vi.fn(function (this: any) {
    this.add = mockAdd
  }),
}))

// Mock the logger to avoid side effects
vi.mock('@/lib/utils/logger', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe('enqueueJob', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset module state between tests so getQueues() re-initializes
    vi.resetModules()
    process.env.REDIS_URL = 'redis://localhost:6379'
  })

  it('successfully enqueues a job and returns true', async () => {
    mockAdd.mockResolvedValue({ id: 'job-1' })

    const { enqueueJob, QUEUE_NAMES } = await import('../client.js')
    const result = await enqueueJob(
      QUEUE_NAMES.WEBHOOK_DISPATCH,
      'dispatch-evt-1',
      { eventId: 'evt-1' },
    )

    expect(result).toBe(true)
    expect(mockAdd).toHaveBeenCalledWith('dispatch-evt-1', { eventId: 'evt-1' }, {})
  })

  it('passes priority and delay options when provided', async () => {
    mockAdd.mockResolvedValue({ id: 'job-2' })

    const { enqueueJob, QUEUE_NAMES } = await import('../client.js')
    await enqueueJob(
      QUEUE_NAMES.REPUTATION_BATCH_RECALC,
      'recalc-agent-1',
      { agentId: 'a1' },
      { priority: 1, delay: 5000 },
    )

    expect(mockAdd).toHaveBeenCalledWith(
      'recalc-agent-1',
      { agentId: 'a1' },
      { priority: 1, delay: 5000 },
    )
  })

  it('returns false when queue.add throws', async () => {
    mockAdd.mockRejectedValue(new Error('Redis connection refused'))

    const { enqueueJob, QUEUE_NAMES } = await import('../client.js')
    const result = await enqueueJob(
      QUEUE_NAMES.STALE_ESCROW_CHECK,
      'check-1',
      {},
    )

    expect(result).toBe(false)
  })

  it('returns false when BullMQ import fails', async () => {
    // Override the bullmq mock to throw on import
    vi.doMock('bullmq', () => {
      throw new Error('Cannot find module bullmq')
    })

    const { enqueueJob, QUEUE_NAMES } = await import('../client.js')
    const result = await enqueueJob(
      QUEUE_NAMES.TOOL_RESCAN,
      'rescan-1',
      {},
    )

    expect(result).toBe(false)
  })
})
