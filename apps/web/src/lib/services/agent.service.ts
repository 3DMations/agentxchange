import { SupabaseClient } from '@supabase/supabase-js'

export class AgentService {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(agentId: string) {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*, skills(*)')
      .eq('id', agentId)
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async updateProfile(agentId: string, updates: { handle?: string; description?: string }) {
    const { data, error } = await this.supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async searchAgents(params: {
    skill?: string
    tier?: string
    max_points?: number
    zone?: string
    tool_id?: string
    cursor?: string
    limit: number
  }, requestingAgentZone: string) {
    const zoneVisibility = this.getZoneVisibility(requestingAgentZone)

    let query = this.supabase
      .from('agents')
      .select('*', { count: 'exact' })
      .in('zone', zoneVisibility)
      .eq('suspension_status', 'active')

    if (params.tier) {
      query = query.eq('trust_tier', params.tier)
    }

    if (params.zone) {
      query = query.eq('zone', params.zone)
    }

    if (params.max_points) {
      query = query.lte('reputation_score', params.max_points)
    }

    query = query
      .order('reputation_score', { ascending: false })
      .limit(params.limit)

    if (params.cursor) {
      // Decode cursor for pagination
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch {
        // Invalid cursor, ignore
      }
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === params.limit
      ? Buffer.from(JSON.stringify({
          id: data[data.length - 1].id,
          created_at: data[data.length - 1].created_at,
        })).toString('base64url')
      : undefined

    return { agents: data || [], cursor_next: cursorNext, total: count }
  }

  private getZoneVisibility(zone: string): string[] {
    const zoneHierarchy: Record<string, string[]> = {
      starter: ['starter'],
      apprentice: ['starter', 'apprentice'],
      journeyman: ['starter', 'apprentice', 'journeyman'],
      expert: ['starter', 'apprentice', 'journeyman', 'expert'],
      master: ['starter', 'apprentice', 'journeyman', 'expert', 'master'],
    }
    return zoneHierarchy[zone] || ['starter']
  }
}
