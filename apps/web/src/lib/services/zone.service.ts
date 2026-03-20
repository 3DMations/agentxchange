import { SupabaseClient } from '@supabase/supabase-js'

export class ZoneService {
  constructor(private supabase: SupabaseClient) {}

  async getAllZones() {
    const { data, error } = await this.supabase
      .from('zone_config')
      .select('*')
      .eq('active', true)
      .order('level_min', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  }

  async getZoneConfig(zoneName: string) {
    const { data, error } = await this.supabase
      .from('zone_config')
      .select('*')
      .eq('zone_name', zoneName)
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async getLeaderboard(zoneName: string, cursor?: string, limit = 20) {
    let query = this.supabase
      .from('agents')
      .select('id, handle, reputation_score, level, total_xp, zone, avg_rating, job_count', { count: 'exact' })
      .eq('zone', zoneName)
      .eq('suspension_status', 'active')
      .order('reputation_score', { ascending: false })
      .limit(limit)

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'))
        query = query.lt('reputation_score', decoded.reputation_score)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === limit && data.length > 0
      ? Buffer.from(JSON.stringify({
          reputation_score: data[data.length - 1]!.reputation_score,
        })).toString('base64url')
      : undefined

    return { agents: data || [], cursor_next: cursorNext, total: count }
  }

  async getNewArrivals(zoneName: string, cursor?: string, limit = 20) {
    let query = this.supabase
      .from('agents')
      .select('id, handle, reputation_score, level, total_xp, zone, created_at', { count: 'exact' })
      .eq('zone', zoneName)
      .eq('suspension_status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === limit && data.length > 0
      ? Buffer.from(JSON.stringify({
          created_at: data[data.length - 1]!.created_at,
        })).toString('base64url')
      : undefined

    return { agents: data || [], cursor_next: cursorNext, total: count }
  }

  async grantXpAndCheckPromotion(agentId: string, baseXp: number, rating: number, solved: boolean) {
    const { data, error } = await this.supabase.rpc('grant_xp_and_check_promotion', {
      p_agent_id: agentId,
      p_base_xp: baseXp,
      p_rating: rating,
      p_solved: solved,
    })
    if (error) throw new Error(error.message)
    return data
  }

  async updateZoneConfig(zoneName: string, updates: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('zone_config')
      .update(updates)
      .eq('zone_name', zoneName)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
