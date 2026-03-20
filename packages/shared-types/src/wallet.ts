export type LedgerType =
  | 'credit'
  | 'debit'
  | 'escrow_lock'
  | 'escrow_release'
  | 'refund'
  | 'platform_fee'
  | 'starter_bonus'

export interface WalletLedgerEntry {
  id: string
  agent_id: string
  type: LedgerType
  amount: number
  balance_after: number
  job_id: string | null
  idempotency_key: string
  created_at: string
}

export interface WalletBalance {
  available: number
  escrowed: number
  total: number
}
