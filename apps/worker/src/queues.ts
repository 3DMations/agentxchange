// Queue definitions for BullMQ background jobs
import { Queue, QueueEvents, type ConnectionOptions } from 'bullmq'
import { logger } from './logger.js'

export const QUEUE_NAMES = {
  WALLET_RECONCILIATION: 'wallet-reconciliation',
  TOOL_RESCAN: 'tool-rescan',
  SWARM_DESCRIPTION: 'swarm-description',
  REPUTATION_BATCH_RECALC: 'reputation-batch-recalc',
  STALE_ESCROW_CHECK: 'stale-escrow-check',
  WEBHOOK_DISPATCH: 'webhook-dispatch',
} as const

export const SCHEDULES = {
  [QUEUE_NAMES.WALLET_RECONCILIATION]: '*/15 * * * *',    // Every 15 minutes
  [QUEUE_NAMES.TOOL_RESCAN]: '0 2 * * *',                  // Daily at 2 AM
  [QUEUE_NAMES.REPUTATION_BATCH_RECALC]: '0 * * * *',      // Hourly
  [QUEUE_NAMES.STALE_ESCROW_CHECK]: '*/30 * * * *',        // Every 30 minutes
} as const

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]

/** Dead letter queue name suffix */
export const DLQ_SUFFIX = '-dlq'

/** Default job options with DLQ behavior */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: false, // Keep failed jobs for inspection
}

/** Webhook-specific job options — more retries with longer backoff */
export const WEBHOOK_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 10000 },
  removeOnComplete: { count: 5000 },
  removeOnFail: false,
}

export function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    const url = new URL(redisUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      username: url.username || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    }
  }
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  }
}

/** Create all queues, including DLQs for each */
export function createQueues(connection: ConnectionOptions) {
  const queues = new Map<string, Queue>()
  const dlqs = new Map<string, Queue>()

  for (const name of Object.values(QUEUE_NAMES)) {
    queues.set(name, new Queue(name, { connection }))
    dlqs.set(name, new Queue(`${name}${DLQ_SUFFIX}`, { connection }))
  }

  return { queues, dlqs }
}

/** Move a failed job to its corresponding dead letter queue */
export async function moveToDeadLetterQueue(
  dlqs: Map<string, Queue>,
  queueName: string,
  jobData: unknown,
  failedReason: string,
) {
  const dlq = dlqs.get(queueName)
  if (!dlq) {
    logger.error({ queueName }, 'No DLQ found for queue')
    return
  }

  await dlq.add('dead-letter', {
    originalQueue: queueName,
    data: jobData,
    failedReason,
    movedAt: new Date().toISOString(),
  })

  logger.warn({ queueName, failedReason }, 'Job moved to dead letter queue')
}
