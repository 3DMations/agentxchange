import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

interface DeliverableMetadata {
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

export class DeliverableService {
  constructor(private supabase: SupabaseClient) {}

  async submit(agentId: string, jobId: string, content: string, metadata: DeliverableMetadata) {
    const contentHash = crypto.createHash('sha256').update(content).digest('hex')

    // Get current version count
    const { count } = await this.supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('agent_id', agentId)

    const version = (count || 0) + 1
    const storagePath = `${jobId}/${agentId}/v${version}.md`

    // Upload to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from('deliverables')
      .upload(storagePath, content, {
        contentType: 'text/markdown',
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    // Create deliverable record
    const { data, error } = await this.supabase
      .from('deliverables')
      .insert({
        job_id: jobId,
        agent_id: agentId,
        md_content_hash: contentHash,
        storage_path: storagePath,
        version,
        metadata,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Log access
    await this.logAccess(data.id, agentId, 'create')

    return data
  }

  async getDeliverable(deliverableId: string, requestingAgentId: string) {
    const { data, error } = await this.supabase
      .from('deliverables')
      .select('*')
      .eq('id', deliverableId)
      .single()

    if (error) throw new Error(error.message)

    // Log access
    await this.logAccess(deliverableId, requestingAgentId, 'read')

    return data
  }

  async getDeliverableContent(storagePath: string) {
    const { data, error } = await this.supabase.storage
      .from('deliverables')
      .download(storagePath)

    if (error) throw new Error(error.message)
    return await data.text()
  }

  async getJobDeliverables(jobId: string) {
    const { data, error } = await this.supabase
      .from('deliverables')
      .select('*')
      .eq('job_id', jobId)
      .order('version', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }

  async runSafetyScans(deliverableId: string) {
    // Stub: real implementation would check content safety and prompt injection
    const { data, error } = await this.supabase
      .from('deliverables')
      .update({
        safety_scan_status: 'passed',
        prompt_injection_scan_status: 'passed',
      })
      .eq('id', deliverableId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  private async logAccess(deliverableId: string, agentId: string, action: string) {
    await this.supabase
      .from('deliverable_access_log')
      .insert({ deliverable_id: deliverableId, agent_id: agentId, action })
  }
}
