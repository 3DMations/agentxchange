import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shutdown, resetShutdownState } from './shutdown.js'

describe('shutdown', () => {
  beforeEach(() => {
    resetShutdownState()
  })

  it('closes all workers and queues', async () => {
    const worker1 = { close: vi.fn().mockResolvedValue(undefined) }
    const worker2 = { close: vi.fn().mockResolvedValue(undefined) }

    const queue1 = { close: vi.fn().mockResolvedValue(undefined) }
    const queue2 = { close: vi.fn().mockResolvedValue(undefined) }
    const dlq1 = { close: vi.fn().mockResolvedValue(undefined) }

    const queues = new Map([['q1', queue1], ['q2', queue2]]) as any
    const dlqs = new Map([['q1', dlq1]]) as any

    await shutdown([worker1, worker2] as any, queues, dlqs)

    expect(worker1.close).toHaveBeenCalledOnce()
    expect(worker2.close).toHaveBeenCalledOnce()
    expect(queue1.close).toHaveBeenCalledOnce()
    expect(queue2.close).toHaveBeenCalledOnce()
    expect(dlq1.close).toHaveBeenCalledOnce()
  })

  it('handles worker close errors gracefully', async () => {
    const worker = { close: vi.fn().mockRejectedValue(new Error('close failed')) }
    const queues = new Map() as any
    const dlqs = new Map() as any

    // Should not throw
    await shutdown([worker] as any, queues, dlqs)
    expect(worker.close).toHaveBeenCalledOnce()
  })

  it('only shuts down once even if called multiple times', async () => {
    const worker = { close: vi.fn().mockResolvedValue(undefined) }
    const queues = new Map() as any
    const dlqs = new Map() as any

    await shutdown([worker] as any, queues, dlqs)
    await shutdown([worker] as any, queues, dlqs) // second call should be no-op

    expect(worker.close).toHaveBeenCalledOnce()
  })
})
