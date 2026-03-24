/**
 * Lightweight BullMQ queue client for enqueuing background jobs from the web app.
 * The actual job processing happens in apps/worker/.
 */
import { createServiceLogger } from '@/lib/utils/logger'

const log = createServiceLogger('queue-client')

// Queue and job option types aligned with apps/worker/src/queues.ts
export const QUEUE_NAMES = {
  WALLET_RECONCILIATION: 'wallet-reconciliation',
  TOOL_RESCAN: 'tool-rescan',
  SWARM_DESCRIPTION: 'swarm-description',
  REPUTATION_BATCH_RECALC: 'reputation-batch-recalc',
  STALE_ESCROW_CHECK: 'stale-escrow-check',
  WEBHOOK_DISPATCH: 'webhook-dispatch',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

let queueInstances: Map<string, any> | null = null
let initAttempted = false

async function getQueues(): Promise<Map<string, any> | null> {
  if (queueInstances) return queueInstances
  if (initAttempted) return null
  initAttempted = true

  try {
    const { Queue } = await import('bullmq')
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const url = new URL(redisUrl)
    const connection = {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      username: url.username || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    }

    queueInstances = new Map()
    for (const name of Object.values(QUEUE_NAMES)) {
      queueInstances.set(name, new Queue(name, { connection }))
    }

    return queueInstances
  } catch {
    log.warn({ message: 'BullMQ not available — background jobs will not be enqueued' })
    return null
  }
}

/**
 * Enqueue a background job for processing by the worker.
 * Fails silently if Redis/BullMQ is unavailable — logs a warning instead.
 */
export async function enqueueJob(
  queueName: QueueName,
  jobName: string,
  data: Record<string, unknown>,
  options?: { priority?: number; delay?: number },
): Promise<boolean> {
  const queues = await getQueues()
  if (!queues) {
    log.warn({ data: { queueName, jobName }, message: 'Cannot enqueue job — queues unavailable' })
    return false
  }

  const queue = queues.get(queueName)
  if (!queue) {
    log.warn({ data: { queueName, jobName }, message: 'Queue not found' })
    return false
  }

  try {
    await queue.add(jobName, data, {
      ...(options?.priority ? { priority: options.priority } : {}),
      ...(options?.delay ? { delay: options.delay } : {}),
    })
    log.info({ data: { queueName, jobName }, message: 'Job enqueued' })
    return true
  } catch (err) {
    log.error({
      data: { queueName, jobName, error: err instanceof Error ? err.message : String(err) },
      message: 'Failed to enqueue job',
    })
    return false
  }
}
