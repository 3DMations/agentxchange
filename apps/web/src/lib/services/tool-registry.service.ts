import { SupabaseClient } from '@supabase/supabase-js'

export class ToolRegistryService {
  constructor(private supabase: SupabaseClient) {}

  async registerTool(agentId: string, data: {
    name: string; provider: string; version: string; url: string;
    documentation_url?: string; category: string; description_short?: string;
    capabilities: string[]; input_formats?: string[]; output_formats?: string[];
    known_limitations?: string[]; pricing_model?: string;
  }) {
    const { data: tool, error } = await this.supabase
      .from('ai_tools')
      .insert({ registered_by_agent_id: agentId, ...data })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return tool
  }

  async getTool(toolId: string) {
    const { data, error } = await this.supabase
      .from('ai_tools')
      .select('*')
      .eq('id', toolId)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async updateTool(toolId: string, agentId: string, updates: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('ai_tools')
      .update(updates)
      .eq('id', toolId)
      .eq('registered_by_agent_id', agentId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async approveTool(toolId: string, approved: boolean) {
    const { data, error } = await this.supabase
      .from('ai_tools')
      .update({
        verification_status: approved ? 'approved' : 'rejected',
        approved_at: approved ? new Date().toISOString() : null,
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', toolId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async rescanTool(toolId: string) {
    const { error } = await this.supabase
      .from('ai_tools')
      .update({
        verification_status: 'pending',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', toolId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { scan_status: 'pending' }
  }

  async getToolStats(toolId: string) {
    // Count how many agents reference this tool in their skills
    const { count: agentsUsing } = await this.supabase
      .from('skills')
      .select('*', { count: 'exact', head: true })
      .contains('ai_tools_used', [toolId])

    // Count jobs that used this tool
    const { count: usageCount } = await this.supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .contains('tools_used', [toolId])

    return {
      usage_count: usageCount || 0,
      agents_using: agentsUsing || 0,
      avg_rating: 0, // Will be computed from job ratings in future
    }
  }

  async searchTools(params: {
    q?: string; category?: string; provider?: string;
    status?: string; cursor?: string; limit: number;
  }) {
    let query = this.supabase
      .from('ai_tools')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(params.limit)

    if (params.q) {
      query = query.or(`name.ilike.%${params.q}%,provider.ilike.%${params.q}%,description_short.ilike.%${params.q}%`)
    }
    if (params.category) query = query.eq('category', params.category)
    if (params.provider) query = query.eq('provider', params.provider)
    if (params.status) query = query.eq('verification_status', params.status)

    if (params.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === params.limit
      ? Buffer.from(JSON.stringify({
          id: data[data.length - 1].id,
          created_at: data[data.length - 1].created_at,
        })).toString('base64url')
      : undefined

    return { tools: data || [], cursor_next: cursorNext, total: count }
  }
}
