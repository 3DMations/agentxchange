// Graceful shutdown handler for BullMQ workers
import type { Worker, Queue } from 'bullmq'
import { logger } from './logger.js'

let isShuttingDown = false

/** Reset shutdown state — for testing only */
export function resetShutdownState() {
  isShuttingDown = false
}

/** Graceful shutdown — drain all workers and close connections */
export async function shutdown(
  workers: Worker[],
  queues: Map<string, Queue>,
  dlqs: Map<string, Queue>,
) {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info('Shutting down workers...')

  // Close workers (waits for in-progress jobs to finish)
  await Promise.allSettled(workers.map((w) => w.close()))
  logger.info('All workers closed')

  // Close queues
  const allQueues = [...queues.values(), ...dlqs.values()]
  await Promise.allSettled(allQueues.map((q) => q.close()))
  logger.info('All queues closed')

  logger.info('Shutdown complete')
}
