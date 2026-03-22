import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { AgentService } from '@/lib/services/agent.service'
import { extractParam } from '@/lib/utils/route-params'
import type { AgentCard } from '@agentxchange/shared-types'

function buildDescription(agent: { handle: string; reputation_score: number; job_count: number; zone: string }, skills: Array<{ name: string; category: string }>) {
  const skillNames = skills.map((s) => s.name).slice(0, 5).join(', ')
  const skillSummary = skillNames ? ` specializing in ${skillNames}` : ''
  return `${agent.handle} is a ${agent.zone}-tier agent${skillSummary} with ${agent.job_count} completed jobs and a reputation score of ${agent.reputation_score}.`
}

function getZoneVisibility(zone: string): string[] {
  const zoneHierarchy: Record<string, string[]> = {
    starter: ['starter'],
    apprentice: ['starter', 'apprentice'],
    journeyman: ['starter', 'apprentice', 'journeyman'],
    expert: ['starter', 'apprentice', 'journeyman', 'expert'],
    master: ['starter', 'apprentice', 'journeyman', 'expert', 'master'],
  }
  return zoneHierarchy[zone] || ['starter']
}

export const GET = withRateLimit(
  withFeatureToggle('a2a_protocol', async (req: NextRequest) => {
    try {
      const url = new URL(req.url)
      const id = extractParam(url.pathname, 'agents')
      if (!id) return apiError('VALIDATION_ERROR', 'Agent ID is required', 400)

      const supabase = await createSupabaseServer()
      const agentService = new AgentService(supabase)
      const profile = await agentService.getProfile(id)

      if (!profile) {
        return apiError('NOT_FOUND', 'Agent not found', 404)
      }

      const skills: Array<{ category: string; name: string; proficiency_level: string; ai_tools_used?: string[] }> = profile.skills || []
      const toolsUsed: string[] = [...new Set(skills.flatMap((s) => s.ai_tools_used || []))]
      const zones = getZoneVisibility(profile.zone)

      const baseUrl = `${url.protocol}//${url.host}`

      const card: AgentCard = {
        id: profile.id,
        handle: profile.handle,
        name: profile.handle,
        description: buildDescription(profile, skills),
        url: `${baseUrl}/agents/${profile.id}`,
        version: '1.0',
        capabilities: {
          skills: skills.map((s: { category: string; name: string; proficiency_level: string }) => ({
            category: s.category,
            name: s.name,
            proficiency_level: s.proficiency_level,
          })),
          tools_used: toolsUsed,
          zones,
        },
        stats: {
          reputation_score: profile.reputation_score,
          solve_rate: profile.solve_rate,
          avg_rating: profile.avg_rating,
          job_count: profile.job_count,
          trust_tier: profile.trust_tier,
          level: profile.level,
          zone: profile.zone,
        },
        provider: {
          organization: 'AgentXchange',
          url: baseUrl,
        },
      }

      return apiSuccess(card)
    } catch (error) {
      return handleRouteError(error, 'agents/[id]/card GET')
    }
  })
)
