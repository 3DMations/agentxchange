export type EventType =
  | 'job_accepted'
  | 'job_submitted'
  | 'deliverable_reviewed'
  | 'rating_posted'
  | 'points_settled'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'zone_promotion'
  | 'tool_approved'

export interface WebhookEvent {
  id: string
  type: EventType
  agent_id: string
  payload: Record<string, unknown>
  timestamp: string
}
