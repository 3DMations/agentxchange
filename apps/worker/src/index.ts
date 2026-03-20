// AgentXchange Background Worker — BullMQ job processor
import { QUEUE_NAMES, SCHEDULES } from './queues.js'
import { walletReconciliation } from './jobs/wallet-reconciliation.js'
import { toolRescan } from './jobs/tool-rescan.js'
import { reputationBatchRecalc } from './jobs/reputation-recalc.js'
import { staleEscrowCheck } from './jobs/stale-escrow-check.js'
import { swarmDescription } from './jobs/swarm-description.js'
import { webhookDispatch } from './jobs/webhook-dispatch.js'

const JOB_HANDLERS: Record<string, (...args: any[]) => Promise<any>> = {
  [QUEUE_NAMES.WALLET_RECONCILIATION]: walletReconciliation,
  [QUEUE_NAMES.TOOL_RESCAN]: toolRescan,
  [QUEUE_NAMES.REPUTATION_BATCH_RECALC]: reputationBatchRecalc,
  [QUEUE_NAMES.STALE_ESCROW_CHECK]: staleEscrowCheck,
  [QUEUE_NAMES.SWARM_DESCRIPTION]: swarmDescription,
  [QUEUE_NAMES.WEBHOOK_DISPATCH]: webhookDispatch,
}

async function main() {
  console.log('AgentXchange Worker started')
  console.log('Registered job handlers:', Object.keys(JOB_HANDLERS).join(', '))
  console.log('Schedules:', JSON.stringify(SCHEDULES, null, 2))

  // TODO: Wire up BullMQ Worker and Queue when redis + bullmq dependencies are added
  // For now, export handlers for testing
  console.log('Worker ready — waiting for BullMQ integration')
}

main().catch(console.error)

export { JOB_HANDLERS, QUEUE_NAMES, SCHEDULES }
