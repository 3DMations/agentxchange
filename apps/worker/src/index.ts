// AgentXchange Background Worker — BullMQ job processor
import { Worker, Queue, type Job, type ConnectionOptions } from 'bullmq'
import { logger } from './logger.js'
import {
  QUEUE_NAMES,
  SCHEDULES,
  DEFAULT_JOB_OPTIONS,
  WEBHOOK_JOB_OPTIONS,
  getRedisConnection,
  createQueues,
  moveToDeadLetterQueue,
} from './queues.js'
import { shutdown } from './shutdown.js'
import { walletReconciliation } from './jobs/wallet-reconciliation.js'
import { toolRescan } from './jobs/tool-rescan.js'
import { reputationBatchRecalc } from './jobs/reputation-recalc.js'
import { staleEscrowCheck } from './jobs/stale-escrow-check.js'
import { swarmDescription } from './jobs/swarm-description.js'
import { webhookDispatch } from './jobs/webhook-dispatch.js'

// Job handler registry — maps queue names to processor functions
const JOB_HANDLERS: Record<string, (data: any) => Promise<any>> = {
  [QUEUE_NAMES.WALLET_RECONCILIATION]: walletReconciliation,
  [QUEUE_NAMES.TOOL_RESCAN]: toolRescan,
  [QUEUE_NAMES.REPUTATION_BATCH_RECALC]: reputationBatchRecalc,
  [QUEUE_NAMES.STALE_ESCROW_CHECK]: staleEscrowCheck,
  [QUEUE_NAMES.SWARM_DESCRIPTION]: swarmDescription,
  [QUEUE_NAMES.WEBHOOK_DISPATCH]: webhookDispatch,
}

// Workers tracked for graceful shutdown
const activeWorkers: Worker[] = []

function getJobOptions(queueName: string) {
  if (queueName === QUEUE_NAMES.WEBHOOK_DISPATCH) return WEBHOOK_JOB_OPTIONS
  return DEFAULT_JOB_OPTIONS
}

/** Create a BullMQ Worker for a given queue name */
export function createWorker(
  queueName: string,
  handler: (data: any) => Promise<any>,
  connection: ConnectionOptions,
  dlqs: Map<string, Queue>,
): Worker {
  const worker = new Worker(
    queueName,
    async (job: Job) => {
      logger.info({ queue: queueName, jobId: job.id, attempt: job.attemptsMade + 1 }, 'Processing job')
      try {
        const result = await handler(job.data)
        logger.info({ queue: queueName, jobId: job.id, result }, 'Job completed')
        return result
      } catch (err) {
        logger.error({ queue: queueName, jobId: job.id, error: String(err) }, 'Job processing error')
        throw err
      }
    },
    {
      connection,
      concurrency: queueName === QUEUE_NAMES.WEBHOOK_DISPATCH ? 10 : 1,
      limiter: queueName === QUEUE_NAMES.WEBHOOK_DISPATCH
        ? { max: 100, duration: 60_000 } // Max 100 webhooks per minute
        : undefined,
    },
  )

  worker.on('failed', async (job, err) => {
    if (!job) return
    const maxAttempts = getJobOptions(queueName).attempts

    if (job.attemptsMade >= maxAttempts) {
      logger.error(
        { queue: queueName, jobId: job.id, attempts: job.attemptsMade, error: err.message },
        'Job exhausted all retries — moving to DLQ',
      )
      await moveToDeadLetterQueue(dlqs, queueName, job.data, err.message)
    }
  })

  worker.on('error', (err) => {
    logger.error({ queue: queueName, error: err.message }, 'Worker error')
  })

  return worker
}

/** Register repeatable (scheduled) jobs */
export async function registerSchedules(queues: Map<string, Queue>) {
  for (const [queueName, cron] of Object.entries(SCHEDULES)) {
    const queue = queues.get(queueName)
    if (!queue) continue

    await queue.upsertJobScheduler(
      `${queueName}-scheduled`,
      { pattern: cron },
      { name: queueName, data: {} },
    )

    logger.info({ queue: queueName, cron }, 'Registered schedule')
  }
}

async function main() {
  const connection = getRedisConnection()

  logger.info({ queues: Object.values(QUEUE_NAMES) }, 'Starting AgentXchange Worker')

  // Create queues and DLQs
  const { queues, dlqs } = createQueues(connection)

  // Create a worker for each queue
  for (const [queueName, handler] of Object.entries(JOB_HANDLERS)) {
    const worker = createWorker(queueName, handler, connection, dlqs)
    activeWorkers.push(worker)
    logger.info({ queue: queueName }, 'Worker registered')
  }

  // Register scheduled/repeatable jobs
  await registerSchedules(queues)

  // Graceful shutdown handlers
  const handleShutdown = async () => {
    await shutdown(activeWorkers, queues, dlqs)
    process.exit(0)
  }

  process.on('SIGTERM', handleShutdown)
  process.on('SIGINT', handleShutdown)

  logger.info(
    { handlers: Object.keys(JOB_HANDLERS).length, schedules: Object.keys(SCHEDULES).length },
    'Worker ready — processing jobs',
  )
}

main().catch((err) => {
  logger.fatal({ error: String(err) }, 'Worker failed to start')
  process.exit(1)
})

export { JOB_HANDLERS, QUEUE_NAMES, SCHEDULES }
