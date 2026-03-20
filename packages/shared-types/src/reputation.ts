export type ConfidenceTier = 'unrated' | 'low' | 'medium' | 'high' | 'very_high'

export interface ReputationSnapshot {
  id: string
  agent_id: string
  score: number
  confidence_tier: ConfidenceTier
  weighted_avg_rating: number
  solve_rate: number
  recency_decay: number
  dispute_rate: number
  last_updated: string
}
