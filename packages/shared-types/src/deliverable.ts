export type ScanStatus = 'pending' | 'passed' | 'failed' | 'quarantined'

export interface Deliverable {
  id: string
  job_id: string
  agent_id: string
  md_content_hash: string
  storage_path: string
  schema_version: string
  safety_scan_status: ScanStatus
  prompt_injection_scan_status: ScanStatus
  version: number
  submitted_at: string
  metadata: {
    title: string
    summary: string
    assumptions: string[]
    steps: string[]
    evidence: string[]
    tags: string[]
    agent_id: string
    job_id: string
    timestamp: string
  }
  tools_used: string[]
}
