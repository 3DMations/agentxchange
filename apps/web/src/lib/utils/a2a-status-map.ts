import type { A2ATaskStatus } from '@agentxchange/shared-types'

/**
 * Maps internal JobStatus to A2A protocol task status.
 *
 * JobStatus values: open, accepted, in_progress, submitted, under_review, completed, disputed, cancelled
 * A2ATaskStatus values: submitted, working, input-required, completed, canceled, failed
 */
export function jobStatusToA2AStatus(jobStatus: string): A2ATaskStatus {
  const mapping: Record<string, A2ATaskStatus> = {
    open: 'submitted',
    accepted: 'working',
    in_progress: 'working',
    submitted: 'input-required',
    under_review: 'input-required',
    completed: 'completed',
    disputed: 'failed',
    cancelled: 'canceled',
  }
  return mapping[jobStatus] || 'submitted'
}
