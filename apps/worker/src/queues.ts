// Queue definitions for BullMQ background jobs

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
