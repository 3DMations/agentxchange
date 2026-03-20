import { SupabaseClient } from '@supabase/supabase-js'

export class SkillService {
  constructor(private supabase: SupabaseClient) {}

  async createSkill(agentId: string, data: {
    category: string; domain: string; name: string; description: string;
    proficiency_level?: string; tags?: string[]; point_range_min: number;
    point_range_max: number; ai_tools_used?: string[];
  }) {
    const { data: skill, error } = await this.supabase
      .from('skills')
      .insert({ agent_id: agentId, ...data })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return skill
  }

  async updateSkill(agentId: string, skillId: string, updates: Record<string, unknown>) {
    const { data: skill, error } = await this.supabase
      .from('skills')
      .update(updates)
      .eq('id', skillId)
      .eq('agent_id', agentId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return skill
  }

  async deleteSkill(agentId: string, skillId: string) {
    const { error } = await this.supabase
      .from('skills')
      .delete()
      .eq('id', skillId)
      .eq('agent_id', agentId)
    if (error) throw new Error(error.message)
    return { deleted: true }
  }

  async getAgentSkills(agentId: string) {
    const { data, error } = await this.supabase
      .from('skills')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  }

  async searchCatalog(params: {
    q?: string; category?: string; domain?: string; proficiency?: string;
    verified?: boolean; zone?: string; min_rating?: number; tool_id?: string;
    cursor?: string; limit: number;
  }, requestingAgentZone: string) {
    let query = this.supabase
      .from('skills')
      .select('*, agent:agents!inner(*)', { count: 'exact' })

    // Full-text search
    if (params.q) {
      query = query.textSearch('search_vector', params.q, { type: 'websearch' })
    }

    if (params.category) query = query.eq('category', params.category)
    if (params.domain) query = query.eq('domain', params.domain)
    if (params.proficiency) query = query.eq('proficiency_level', params.proficiency)
    if (params.verified !== undefined) query = query.eq('verified', params.verified)
    if (params.min_rating) query = query.gte('avg_rating_for_skill', params.min_rating)

    // Zone filtering via inner join on agents
    const zoneVisibility = this.getZoneVisibility(requestingAgentZone)
    query = query.in('agent.zone', zoneVisibility)

    query = query
      .order('verified', { ascending: false })
      .order('avg_rating_for_skill', { ascending: false })
      .limit(params.limit)

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

    return { skills: data || [], cursor_next: cursorNext, total: count }
  }

  async initiateVerification(skillId: string, method: string) {
    const { data, error } = await this.supabase
      .from('skills')
      .update({ verification_method: method })
      .eq('id', skillId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { verification_status: data.verification_method }
  }

  private getZoneVisibility(zone: string): string[] {
    const h: Record<string, string[]> = {
      starter: ['starter'],
      apprentice: ['starter', 'apprentice'],
      journeyman: ['starter', 'apprentice', 'journeyman'],
      expert: ['starter', 'apprentice', 'journeyman', 'expert'],
      master: ['starter', 'apprentice', 'journeyman', 'expert', 'master'],
    }
    return h[zone] || ['starter']
  }
}
