import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock middleware to pass-through
vi.mock('@/lib/middleware/rate-limit', () => ({
  withRateLimit: (handler: any) => handler,
}))
vi.mock('@/lib/middleware/feature-toggle', () => ({
  withFeatureToggle: (_name: string, handler: any) => handler,
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn().mockResolvedValue({}),
}))

// Mock AgentService
const mockGetProfile = vi.fn()
vi.mock('@/lib/services/agent.service', () => ({
  AgentService: vi.fn(function () { return { getProfile: mockGetProfile } }),
}))

import { GET } from '../route'

function makeRequest(agentId: string) {
  return new NextRequest(`http://localhost/api/v1/agents/${agentId}/card`, {
    method: 'GET',
  })
}

const mockAgent = {
  id: 'agent-123',
  handle: 'code-wizard',
  email: 'wizard@test.com',
  role: 'service',
  verified: true,
  suspension_status: 'active',
  trust_tier: 'gold',
  reputation_score: 95,
  solve_rate: 0.92,
  avg_rating: 4.7,
  job_count: 42,
  dispute_count: 1,
  level: 5,
  zone: 'expert',
  total_xp: 500,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  skills: [
    {
      id: 'skill-1',
      agent_id: 'agent-123',
      category: 'code_generation',
      name: 'TypeScript Development',
      proficiency_level: 'expert',
      ai_tools_used: ['copilot', 'claude'],
    },
    {
      id: 'skill-2',
      agent_id: 'agent-123',
      category: 'data_analysis',
      name: 'Data Pipeline',
      proficiency_level: 'advanced',
      ai_tools_used: ['claude'],
    },
  ],
}

describe('GET /api/v1/agents/[id]/card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns agent card successfully', async () => {
    mockGetProfile.mockResolvedValue(mockAgent)

    const res = await GET(makeRequest('agent-123'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.error).toBeNull()
    expect(body.data.id).toBe('agent-123')
    expect(body.data.handle).toBe('code-wizard')
    expect(body.data.name).toBe('code-wizard')
    expect(body.data.version).toBe('1.0')
    expect(body.data.capabilities.skills).toHaveLength(2)
    expect(body.data.capabilities.skills[0]).toEqual({
      category: 'code_generation',
      name: 'TypeScript Development',
      proficiency_level: 'expert',
    })
    expect(body.data.capabilities.tools_used).toContain('copilot')
    expect(body.data.capabilities.tools_used).toContain('claude')
    expect(body.data.capabilities.zones).toEqual(['starter', 'apprentice', 'journeyman', 'expert'])
    expect(body.data.stats.reputation_score).toBe(95)
    expect(body.data.stats.trust_tier).toBe('gold')
    expect(body.data.stats.zone).toBe('expert')
    expect(body.data.provider.organization).toBe('AgentXchange')
  })

  it('deduplicates tools_used across skills', async () => {
    mockGetProfile.mockResolvedValue(mockAgent)

    const res = await GET(makeRequest('agent-123'))
    const body = await res.json()

    // 'claude' appears in both skills but should only appear once
    const claudeCount = body.data.capabilities.tools_used.filter((t: string) => t === 'claude').length
    expect(claudeCount).toBe(1)
  })

  it('returns 400 when agent ID is missing from path', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents//card', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 500 when service throws', async () => {
    mockGetProfile.mockRejectedValue(new Error('DB connection lost'))

    const res = await GET(makeRequest('agent-123'))
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('An unexpected error occurred')
  })

  it('generates description from agent profile', async () => {
    mockGetProfile.mockResolvedValue(mockAgent)

    const res = await GET(makeRequest('agent-123'))
    const body = await res.json()

    expect(body.data.description).toContain('code-wizard')
    expect(body.data.description).toContain('expert')
    expect(body.data.description).toContain('42')
    expect(body.data.description).toContain('95')
  })

  it('handles agent with no skills', async () => {
    mockGetProfile.mockResolvedValue({
      ...mockAgent,
      skills: [],
    })

    const res = await GET(makeRequest('agent-123'))
    const body = await res.json()

    expect(body.data.capabilities.skills).toHaveLength(0)
    expect(body.data.capabilities.tools_used).toHaveLength(0)
  })

  it('includes profile URL in card', async () => {
    mockGetProfile.mockResolvedValue(mockAgent)

    const res = await GET(makeRequest('agent-123'))
    const body = await res.json()

    expect(body.data.url).toContain('/agents/agent-123')
    expect(body.data.provider.url).toContain('localhost')
  })
})
