import { describe, it, expect } from 'vitest'
import type {
  // api-envelope
  ApiError,
  ApiMeta,
  ApiResponse,
  // agent
  AgentRole,
  SuspensionStatus,
  TrustTier,
  ZoneEnum,
  Agent,
  AgentCardSkill,
  AgentCard,
  A2ATaskStatus,
  A2ATask,
  // job
  JobStatus,
  Job,
  // wallet
  LedgerType,
  WalletLedgerEntry,
  WalletBalance,
  // skill
  SkillCategory,
  ProficiencyLevel,
  VerificationMethod,
  Skill,
  // tool
  ToolCategory,
  PricingModel,
  ToolVerificationStatus,
  AiTool,
  // zone
  ZoneConfig,
  // reputation
  ConfidenceTier,
  ReputationSnapshot,
  // deliverable
  ScanStatus,
  Deliverable,
  // dispute
  DisputeStatus,
  DisputePriority,
  Dispute,
  // events
  EventType,
  WebhookEvent,
  // mcp-credential
  McpCredential,
} from '../index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const uuid = '00000000-0000-0000-0000-000000000001'
const iso = '2026-01-01T00:00:00.000Z'

// ---------------------------------------------------------------------------
// api-envelope
// ---------------------------------------------------------------------------

describe('ApiEnvelope', () => {
  it('ApiError accepts valid shape', () => {
    const err: ApiError = { code: 'NOT_FOUND', message: 'Not found' }
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('Not found')
    expect(err.details).toBeUndefined()
  })

  it('ApiError accepts optional details', () => {
    const err: ApiError = { code: 'BAD', message: 'bad', details: { field: 'x' } }
    expect(err.details).toEqual({ field: 'x' })
  })

  it('ApiMeta accepts all optional fields', () => {
    const meta: ApiMeta = {}
    expect(meta.cursor_next).toBeUndefined()
    expect(meta.total).toBeUndefined()
    expect(meta.filters_applied).toBeUndefined()
  })

  it('ApiMeta accepts populated fields', () => {
    const meta: ApiMeta = { cursor_next: 'abc', total: 42, filters_applied: { q: 'test' } }
    expect(meta.total).toBe(42)
    expect(meta.cursor_next).toBe('abc')
  })

  it('ApiResponse<T> wraps string data', () => {
    const res: ApiResponse<string> = { data: 'hello', error: null, meta: {} }
    expect(res.data).toBe('hello')
    expect(res.error).toBeNull()
  })

  it('ApiResponse<T> wraps object data', () => {
    const res: ApiResponse<{ count: number }> = { data: { count: 5 }, error: null, meta: {} }
    expect(res.data?.count).toBe(5)
  })

  it('ApiResponse<T> represents error state', () => {
    const res: ApiResponse<string> = {
      data: null,
      error: { code: 'ERR', message: 'fail' },
      meta: {},
    }
    expect(res.data).toBeNull()
    expect(res.error?.code).toBe('ERR')
  })
})

// ---------------------------------------------------------------------------
// agent
// ---------------------------------------------------------------------------

describe('Agent', () => {
  const validAgent: Agent = {
    id: uuid,
    handle: 'alice',
    email: 'alice@example.com',
    role: 'service',
    verified: true,
    suspension_status: 'active',
    trust_tier: 'silver',
    reputation_score: 85,
    solve_rate: 0.92,
    avg_rating: 4.5,
    job_count: 20,
    dispute_count: 1,
    level: 5,
    zone: 'journeyman',
    total_xp: 1200,
    onboarding_acknowledged_at: iso,
    onboarding_prompt_version: 2,
    api_key_hash: null,
    created_at: iso,
    updated_at: iso,
  }

  it('accepts valid agent data', () => {
    expect(validAgent.id).toBe(uuid)
    expect(validAgent.handle).toBe('alice')
    expect(validAgent.role).toBe('service')
    expect(validAgent.verified).toBe(true)
  })

  it('has all expected fields', () => {
    const keys = Object.keys(validAgent)
    expect(keys).toContain('id')
    expect(keys).toContain('handle')
    expect(keys).toContain('email')
    expect(keys).toContain('role')
    expect(keys).toContain('verified')
    expect(keys).toContain('suspension_status')
    expect(keys).toContain('trust_tier')
    expect(keys).toContain('reputation_score')
    expect(keys).toContain('solve_rate')
    expect(keys).toContain('avg_rating')
    expect(keys).toContain('job_count')
    expect(keys).toContain('dispute_count')
    expect(keys).toContain('level')
    expect(keys).toContain('zone')
    expect(keys).toContain('total_xp')
    expect(keys).toContain('onboarding_acknowledged_at')
    expect(keys).toContain('onboarding_prompt_version')
    expect(keys).toContain('api_key_hash')
    expect(keys).toContain('created_at')
    expect(keys).toContain('updated_at')
  })

  it('AgentRole covers all expected values', () => {
    const roles: AgentRole[] = ['client', 'service', 'admin', 'moderator']
    expect(roles).toHaveLength(4)
    roles.forEach((r) => expect(typeof r).toBe('string'))
  })

  it('SuspensionStatus covers all expected values', () => {
    const statuses: SuspensionStatus[] = ['active', 'suspended', 'banned']
    expect(statuses).toHaveLength(3)
  })

  it('TrustTier covers all expected values', () => {
    const tiers: TrustTier[] = ['new', 'bronze', 'silver', 'gold', 'platinum']
    expect(tiers).toHaveLength(5)
  })

  it('ZoneEnum covers all expected values', () => {
    const zones: ZoneEnum[] = ['starter', 'apprentice', 'journeyman', 'expert', 'master']
    expect(zones).toHaveLength(5)
  })

  it('nullable fields accept null', () => {
    const agent: Agent = { ...validAgent, onboarding_acknowledged_at: null, api_key_hash: null }
    expect(agent.onboarding_acknowledged_at).toBeNull()
    expect(agent.api_key_hash).toBeNull()
  })
})

describe('AgentCard', () => {
  const card: AgentCard = {
    id: uuid,
    handle: 'alice',
    name: 'Alice Agent',
    description: 'A helpful agent',
    url: 'https://agentxchange.io/agents/alice',
    version: '1.0',
    capabilities: {
      skills: [{ category: 'code_generation', name: 'TypeScript', proficiency_level: 'expert' }],
      tools_used: ['gpt-4'],
      zones: ['journeyman'],
    },
    stats: {
      reputation_score: 90,
      solve_rate: 0.95,
      avg_rating: 4.8,
      job_count: 50,
      trust_tier: 'gold',
      level: 10,
      zone: 'expert',
    },
    provider: {
      organization: 'AgentXchange',
      url: 'https://agentxchange.io',
    },
  }

  it('accepts valid card data', () => {
    expect(card.version).toBe('1.0')
    expect(card.provider.organization).toBe('AgentXchange')
  })

  it('capabilities contain skills array', () => {
    expect(card.capabilities.skills).toHaveLength(1)
    expect(card.capabilities.skills[0]!.category).toBe('code_generation')
  })

  it('stats has all required numeric fields', () => {
    expect(typeof card.stats.reputation_score).toBe('number')
    expect(typeof card.stats.solve_rate).toBe('number')
    expect(typeof card.stats.avg_rating).toBe('number')
    expect(typeof card.stats.job_count).toBe('number')
    expect(typeof card.stats.level).toBe('number')
  })
})

describe('A2ATask', () => {
  it('A2ATaskStatus covers all expected values', () => {
    const statuses: A2ATaskStatus[] = [
      'submitted', 'working', 'input-required', 'completed', 'canceled', 'failed',
    ]
    expect(statuses).toHaveLength(6)
  })

  it('accepts valid task data', () => {
    const task: A2ATask = {
      id: uuid,
      agent_id: uuid,
      status: 'submitted',
      description: 'Generate a report',
      point_budget: 100,
      acceptance_criteria: 'Must include charts',
      created_at: iso,
      updated_at: null,
    }
    expect(task.status).toBe('submitted')
    expect(task.updated_at).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// job
// ---------------------------------------------------------------------------

describe('Job', () => {
  const validJob: Job = {
    id: uuid,
    client_agent_id: uuid,
    service_agent_id: null,
    status: 'open',
    description: 'Build an API',
    acceptance_criteria: 'Must pass tests',
    point_budget: 500,
    point_quote: null,
    zone_at_creation: 'journeyman',
    tools_used: ['gpt-4', 'copilot'],
    feature_flag_cohort: null,
    created_at: iso,
    accepted_at: null,
    submitted_at: null,
    reviewed_at: null,
    helpfulness_score: null,
    solved: null,
    dispute_id: null,
  }

  it('accepts valid job data', () => {
    expect(validJob.client_agent_id).toBe(uuid)
    expect(validJob.service_agent_id).toBeNull()
    expect(validJob.tools_used).toEqual(['gpt-4', 'copilot'])
  })

  it('JobStatus covers all expected values', () => {
    const statuses: JobStatus[] = [
      'open', 'accepted', 'in_progress', 'submitted',
      'under_review', 'completed', 'disputed', 'cancelled',
    ]
    expect(statuses).toHaveLength(8)
  })

  it('nullable fields accept non-null values when job progresses', () => {
    const accepted: Job = {
      ...validJob,
      status: 'accepted',
      service_agent_id: uuid,
      point_quote: 400,
      accepted_at: iso,
    }
    expect(accepted.service_agent_id).toBe(uuid)
    expect(accepted.point_quote).toBe(400)
    expect(accepted.accepted_at).toBe(iso)
  })

  it('completed job has review fields populated', () => {
    const completed: Job = {
      ...validJob,
      status: 'completed',
      service_agent_id: uuid,
      reviewed_at: iso,
      helpfulness_score: 5,
      solved: true,
    }
    expect(completed.helpfulness_score).toBe(5)
    expect(completed.solved).toBe(true)
  })

  it('foreign key fields are string UUIDs', () => {
    expect(typeof validJob.id).toBe('string')
    expect(typeof validJob.client_agent_id).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// wallet
// ---------------------------------------------------------------------------

describe('Wallet', () => {
  it('LedgerType covers all expected values', () => {
    const types: LedgerType[] = [
      'credit', 'debit', 'escrow_lock', 'escrow_release',
      'refund', 'platform_fee', 'starter_bonus',
    ]
    expect(types).toHaveLength(7)
  })

  it('WalletLedgerEntry accepts valid data', () => {
    const entry: WalletLedgerEntry = {
      id: uuid,
      agent_id: uuid,
      type: 'credit',
      amount: 100,
      balance_after: 600,
      job_id: null,
      idempotency_key: 'idem-001',
      created_at: iso,
    }
    expect(entry.amount).toBe(100)
    expect(entry.balance_after).toBe(600)
    expect(entry.idempotency_key).toBe('idem-001')
  })

  it('WalletLedgerEntry job_id is nullable', () => {
    const entry: WalletLedgerEntry = {
      id: uuid, agent_id: uuid, type: 'starter_bonus',
      amount: 50, balance_after: 50, job_id: null,
      idempotency_key: 'k', created_at: iso,
    }
    expect(entry.job_id).toBeNull()
  })

  it('WalletBalance has available, escrowed, total', () => {
    const bal: WalletBalance = { available: 300, escrowed: 200, total: 500 }
    expect(bal.available + bal.escrowed).toBe(bal.total)
  })

  it('WalletBalance fields are numbers', () => {
    const bal: WalletBalance = { available: 0, escrowed: 0, total: 0 }
    expect(typeof bal.available).toBe('number')
    expect(typeof bal.escrowed).toBe('number')
    expect(typeof bal.total).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// skill
// ---------------------------------------------------------------------------

describe('Skill', () => {
  const validSkill: Skill = {
    id: uuid,
    agent_id: uuid,
    category: 'code_generation',
    domain: 'backend',
    name: 'Node.js APIs',
    description: 'Build REST APIs with Node.js',
    proficiency_level: 'advanced',
    verified: true,
    verification_method: 'platform_test_job',
    sample_deliverable_id: null,
    tags: ['node', 'api', 'rest'],
    point_range_min: 100,
    point_range_max: 500,
    avg_rating_for_skill: 4.7,
    jobs_completed_for_skill: 15,
    last_used_at: iso,
    ai_tools_used: ['copilot'],
    created_at: iso,
    updated_at: iso,
  }

  it('accepts valid skill data', () => {
    expect(validSkill.category).toBe('code_generation')
    expect(validSkill.proficiency_level).toBe('advanced')
    expect(validSkill.tags).toEqual(['node', 'api', 'rest'])
  })

  it('SkillCategory covers all expected values', () => {
    const cats: SkillCategory[] = [
      'code_generation', 'data_analysis', 'content_creation', 'research',
      'translation', 'devops', 'security_audit', 'design',
    ]
    expect(cats).toHaveLength(8)
  })

  it('ProficiencyLevel covers all expected values', () => {
    const levels: ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']
    expect(levels).toHaveLength(4)
  })

  it('VerificationMethod covers all expected values', () => {
    const methods: VerificationMethod[] = ['none', 'platform_test_job', 'peer_review', 'portfolio_sample']
    expect(methods).toHaveLength(4)
  })

  it('nullable fields accept null', () => {
    expect(validSkill.sample_deliverable_id).toBeNull()
    const skill2: Skill = { ...validSkill, last_used_at: null }
    expect(skill2.last_used_at).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// tool
// ---------------------------------------------------------------------------

describe('AiTool', () => {
  const validTool: AiTool = {
    id: uuid,
    name: 'GPT-4',
    provider: 'OpenAI',
    version: '4.0',
    url: 'https://openai.com',
    documentation_url: 'https://docs.openai.com',
    category: 'llm',
    description_short: 'Large language model',
    description_full: { overview: 'A powerful LLM' },
    capabilities: ['text-generation', 'code-generation'],
    input_formats: ['text', 'json'],
    output_formats: ['text', 'json'],
    known_limitations: ['token limits'],
    pricing_model: 'per_token',
    last_verified_at: iso,
    verification_status: 'approved',
    registered_by_agent_id: uuid,
    approved_at: iso,
    swarm_confidence_score: 0.85,
    created_at: iso,
  }

  it('accepts valid tool data', () => {
    expect(validTool.name).toBe('GPT-4')
    expect(validTool.category).toBe('llm')
    expect(validTool.verification_status).toBe('approved')
  })

  it('ToolCategory covers all expected values', () => {
    const cats: ToolCategory[] = ['llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom']
    expect(cats).toHaveLength(7)
  })

  it('PricingModel covers all expected values', () => {
    const models: PricingModel[] = ['free', 'per_token', 'per_call', 'subscription', 'unknown']
    expect(models).toHaveLength(5)
  })

  it('ToolVerificationStatus covers all expected values', () => {
    const statuses: ToolVerificationStatus[] = ['pending', 'approved', 'stale', 'rejected']
    expect(statuses).toHaveLength(4)
  })

  it('nullable fields accept null', () => {
    const tool: AiTool = {
      ...validTool,
      documentation_url: null,
      description_short: null,
      description_full: null,
      last_verified_at: null,
      approved_at: null,
      swarm_confidence_score: null,
    }
    expect(tool.documentation_url).toBeNull()
    expect(tool.description_full).toBeNull()
    expect(tool.swarm_confidence_score).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// zone
// ---------------------------------------------------------------------------

describe('ZoneConfig', () => {
  it('accepts valid zone config', () => {
    const config: ZoneConfig = {
      id: uuid,
      zone_name: 'journeyman',
      level_min: 5,
      level_max: 10,
      job_point_cap: 1000,
      visibility_rules: { can_see_zones: ['starter', 'apprentice', 'journeyman'] },
      unlock_criteria: { min_jobs: 10 },
      promotion_rules: { min_rating: 4.0 },
      active: true,
      updated_at: iso,
    }
    expect(config.zone_name).toBe('journeyman')
    expect(config.visibility_rules.can_see_zones).toContain('journeyman')
    expect(config.active).toBe(true)
  })

  it('visibility_rules.can_see_zones accepts ZoneEnum values', () => {
    const config: ZoneConfig = {
      id: uuid,
      zone_name: 'master',
      level_min: 20,
      level_max: 99,
      job_point_cap: 10000,
      visibility_rules: { can_see_zones: ['starter', 'apprentice', 'journeyman', 'expert', 'master'] },
      unlock_criteria: {},
      promotion_rules: {},
      active: true,
      updated_at: iso,
    }
    expect(config.visibility_rules.can_see_zones).toHaveLength(5)
  })

  it('level_min and level_max are numbers', () => {
    const config: ZoneConfig = {
      id: uuid, zone_name: 'starter', level_min: 0, level_max: 4,
      job_point_cap: 200, visibility_rules: { can_see_zones: ['starter'] },
      unlock_criteria: {}, promotion_rules: {}, active: true, updated_at: iso,
    }
    expect(typeof config.level_min).toBe('number')
    expect(typeof config.level_max).toBe('number')
    expect(config.level_max).toBeGreaterThan(config.level_min)
  })
})

// ---------------------------------------------------------------------------
// reputation
// ---------------------------------------------------------------------------

describe('ReputationSnapshot', () => {
  it('accepts valid snapshot data', () => {
    const snap: ReputationSnapshot = {
      id: uuid,
      agent_id: uuid,
      score: 87,
      confidence_tier: 'high',
      weighted_avg_rating: 4.6,
      solve_rate: 0.91,
      recency_decay: 0.95,
      dispute_rate: 0.02,
      last_updated: iso,
    }
    expect(snap.score).toBe(87)
    expect(snap.confidence_tier).toBe('high')
    expect(snap.recency_decay).toBe(0.95)
  })

  it('ConfidenceTier covers all expected values', () => {
    const tiers: ConfidenceTier[] = ['unrated', 'low', 'medium', 'high', 'very_high']
    expect(tiers).toHaveLength(5)
  })

  it('numeric fields are numbers', () => {
    const snap: ReputationSnapshot = {
      id: uuid, agent_id: uuid, score: 0, confidence_tier: 'unrated',
      weighted_avg_rating: 0, solve_rate: 0, recency_decay: 1,
      dispute_rate: 0, last_updated: iso,
    }
    expect(typeof snap.score).toBe('number')
    expect(typeof snap.weighted_avg_rating).toBe('number')
    expect(typeof snap.solve_rate).toBe('number')
    expect(typeof snap.recency_decay).toBe('number')
    expect(typeof snap.dispute_rate).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// deliverable
// ---------------------------------------------------------------------------

describe('Deliverable', () => {
  const validDeliverable: Deliverable = {
    id: uuid,
    job_id: uuid,
    agent_id: uuid,
    md_content_hash: 'sha256-abc123',
    storage_path: '/deliverables/job-1/v1.md',
    schema_version: '1.0',
    safety_scan_status: 'passed',
    prompt_injection_scan_status: 'passed',
    version: 1,
    submitted_at: iso,
    metadata: {
      title: 'API Report',
      summary: 'Analysis of endpoints',
      assumptions: ['All endpoints are REST'],
      steps: ['Step 1', 'Step 2'],
      evidence: ['Source A'],
      tags: ['api', 'report'],
      agent_id: uuid,
      job_id: uuid,
      timestamp: iso,
    },
    tools_used: ['gpt-4'],
  }

  it('accepts valid deliverable data', () => {
    expect(validDeliverable.schema_version).toBe('1.0')
    expect(validDeliverable.safety_scan_status).toBe('passed')
    expect(validDeliverable.version).toBe(1)
  })

  it('ScanStatus covers all expected values', () => {
    const statuses: ScanStatus[] = ['pending', 'passed', 'failed', 'quarantined']
    expect(statuses).toHaveLength(4)
  })

  it('metadata has all required nested fields', () => {
    const m = validDeliverable.metadata
    expect(m.title).toBeDefined()
    expect(m.summary).toBeDefined()
    expect(Array.isArray(m.assumptions)).toBe(true)
    expect(Array.isArray(m.steps)).toBe(true)
    expect(Array.isArray(m.evidence)).toBe(true)
    expect(Array.isArray(m.tags)).toBe(true)
    expect(m.agent_id).toBe(uuid)
    expect(m.job_id).toBe(uuid)
    expect(m.timestamp).toBe(iso)
  })

  it('tools_used is a string array', () => {
    expect(Array.isArray(validDeliverable.tools_used)).toBe(true)
    validDeliverable.tools_used.forEach((t) => expect(typeof t).toBe('string'))
  })
})

// ---------------------------------------------------------------------------
// dispute
// ---------------------------------------------------------------------------

describe('Dispute', () => {
  it('accepts valid dispute data', () => {
    const dispute: Dispute = {
      id: uuid,
      job_id: uuid,
      raised_by: uuid,
      reason: 'Deliverable incomplete',
      status: 'open',
      priority: 'high',
      assigned_to: null,
      resolution: null,
      audit_trail: [{ action: 'opened', by: uuid, at: iso }],
      opened_at: iso,
      resolved_at: null,
    }
    expect(dispute.reason).toBe('Deliverable incomplete')
    expect(dispute.status).toBe('open')
    expect(dispute.priority).toBe('high')
  })

  it('DisputeStatus covers all expected values', () => {
    const statuses: DisputeStatus[] = ['open', 'in_review', 'resolved', 'escalated']
    expect(statuses).toHaveLength(4)
  })

  it('DisputePriority covers all expected values', () => {
    const priorities: DisputePriority[] = ['low', 'normal', 'high', 'critical']
    expect(priorities).toHaveLength(4)
  })

  it('resolved dispute has resolution and resolved_at', () => {
    const dispute: Dispute = {
      id: uuid, job_id: uuid, raised_by: uuid, reason: 'Bad quality',
      status: 'resolved', priority: 'normal', assigned_to: uuid,
      resolution: 'Refund issued', audit_trail: [],
      opened_at: iso, resolved_at: iso,
    }
    expect(dispute.resolution).toBe('Refund issued')
    expect(dispute.resolved_at).toBe(iso)
    expect(dispute.assigned_to).toBe(uuid)
  })

  it('audit_trail is an array of records', () => {
    const dispute: Dispute = {
      id: uuid, job_id: uuid, raised_by: uuid, reason: 'r',
      status: 'open', priority: 'low', assigned_to: null,
      resolution: null, audit_trail: [{ event: 'created' }, { event: 'escalated' }],
      opened_at: iso, resolved_at: null,
    }
    expect(dispute.audit_trail).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// events
// ---------------------------------------------------------------------------

describe('WebhookEvent', () => {
  it('accepts valid event data', () => {
    const event: WebhookEvent = {
      id: uuid,
      type: 'job_accepted',
      agent_id: uuid,
      payload: { job_id: uuid },
      timestamp: iso,
    }
    expect(event.type).toBe('job_accepted')
    expect(event.payload).toEqual({ job_id: uuid })
  })

  it('EventType covers all expected values', () => {
    const types: EventType[] = [
      'job_accepted', 'job_submitted', 'deliverable_reviewed',
      'rating_posted', 'points_settled', 'dispute_opened',
      'dispute_resolved', 'zone_promotion', 'tool_approved',
    ]
    expect(types).toHaveLength(9)
  })

  it('payload accepts arbitrary record data', () => {
    const event: WebhookEvent = {
      id: uuid, type: 'rating_posted', agent_id: uuid,
      payload: { rating: 5, comment: 'Excellent', nested: { deep: true } },
      timestamp: iso,
    }
    expect(event.payload).toHaveProperty('rating')
    expect(event.payload).toHaveProperty('nested')
  })
})

// ---------------------------------------------------------------------------
// mcp-credential
// ---------------------------------------------------------------------------

describe('McpCredential', () => {
  it('accepts valid credential data', () => {
    const cred: McpCredential = {
      id: uuid,
      agent_id: uuid,
      scoped_permissions: ['read:agents', 'write:jobs'],
      jwt_token_hash: 'sha256-xyz',
      expires_at: iso,
      created_at: iso,
      revoked: false,
    }
    expect(cred.scoped_permissions).toHaveLength(2)
    expect(cred.revoked).toBe(false)
  })

  it('revoked credential', () => {
    const cred: McpCredential = {
      id: uuid, agent_id: uuid, scoped_permissions: [],
      jwt_token_hash: 'h', expires_at: iso, created_at: iso, revoked: true,
    }
    expect(cred.revoked).toBe(true)
    expect(cred.scoped_permissions).toHaveLength(0)
  })

  it('scoped_permissions is a string array', () => {
    const cred: McpCredential = {
      id: uuid, agent_id: uuid,
      scoped_permissions: ['admin:all'],
      jwt_token_hash: 'h', expires_at: iso, created_at: iso, revoked: false,
    }
    cred.scoped_permissions.forEach((p) => expect(typeof p).toBe('string'))
  })
})

// ---------------------------------------------------------------------------
// barrel export verification
// ---------------------------------------------------------------------------

describe('barrel index exports', () => {
  it('re-exports all modules from index', async () => {
    const mod = await import('../index')
    // Type-only modules export no runtime values, but the import itself must succeed
    expect(mod).toBeDefined()
  })

  it('individual modules are importable', async () => {
    const modules = [
      import('../api-envelope'),
      import('../agent'),
      import('../job'),
      import('../wallet'),
      import('../skill'),
      import('../tool'),
      import('../zone'),
      import('../reputation'),
      import('../deliverable'),
      import('../dispute'),
      import('../events'),
      import('../mcp-credential'),
    ]
    const results = await Promise.all(modules)
    results.forEach((m) => expect(m).toBeDefined())
  })
})
