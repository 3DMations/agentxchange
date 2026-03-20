import { describe, it, expect } from 'vitest'
import { registerAgentSchema, loginAgentSchema, updateProfileSchema, searchAgentsSchema, acknowledgeOnboardingSchema } from './agent.schema'

describe('registerAgentSchema', () => {
  it('accepts valid input', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'agent1', role: 'service' })
    expect(result.success).toBe(true)
  })

  it('rejects short password', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '123', handle: 'agent1' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerAgentSchema.safeParse({ email: 'notanemail', password: '12345678', handle: 'agent1' })
    expect(result.success).toBe(false)
  })

  it('rejects handle with spaces', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'has spaces' })
    expect(result.success).toBe(false)
  })

  it('defaults role to service', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'agent1' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.role).toBe('service')
  })

  it('rejects invalid role', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'agent1', role: 'admin' })
    expect(result.success).toBe(false)
  })

  it('accepts client role', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'agent1', role: 'client' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.role).toBe('client')
  })

  it('rejects handle shorter than 3 chars', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejects handle longer than 30 chars', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'a'.repeat(31) })
    expect(result.success).toBe(false)
  })

  it('accepts handle with dashes and underscores', () => {
    const result = registerAgentSchema.safeParse({ email: 'a@b.com', password: '12345678', handle: 'my-agent_1' })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = registerAgentSchema.safeParse({ password: '12345678', handle: 'agent1' })
    expect(result.success).toBe(false)
  })
})

describe('loginAgentSchema', () => {
  it('accepts valid input', () => {
    expect(loginAgentSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })

  it('rejects empty password', () => {
    expect(loginAgentSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(loginAgentSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(loginAgentSchema.safeParse({}).success).toBe(false)
  })
})

describe('updateProfileSchema', () => {
  it('accepts partial updates', () => {
    expect(updateProfileSchema.safeParse({ handle: 'newname' }).success).toBe(true)
    expect(updateProfileSchema.safeParse({}).success).toBe(true)
  })

  it('rejects too short handle', () => {
    expect(updateProfileSchema.safeParse({ handle: 'ab' }).success).toBe(false)
  })

  it('accepts description only', () => {
    expect(updateProfileSchema.safeParse({ description: 'I am an agent' }).success).toBe(true)
  })

  it('rejects description over 1000 chars', () => {
    expect(updateProfileSchema.safeParse({ description: 'x'.repeat(1001) }).success).toBe(false)
  })

  it('accepts both fields', () => {
    expect(updateProfileSchema.safeParse({ handle: 'newname', description: 'desc' }).success).toBe(true)
  })
})

describe('searchAgentsSchema', () => {
  it('uses default limit', () => {
    const result = searchAgentsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(20)
  })

  it('rejects limit over 100', () => {
    const result = searchAgentsSchema.safeParse({ limit: '200' })
    expect(result.success).toBe(false)
  })

  it('accepts valid zone', () => {
    expect(searchAgentsSchema.safeParse({ zone: 'expert' }).success).toBe(true)
  })

  it('rejects invalid zone', () => {
    expect(searchAgentsSchema.safeParse({ zone: 'fake' }).success).toBe(false)
  })

  it('accepts valid tier', () => {
    expect(searchAgentsSchema.safeParse({ tier: 'gold' }).success).toBe(true)
  })

  it('rejects invalid tier', () => {
    expect(searchAgentsSchema.safeParse({ tier: 'diamond' }).success).toBe(false)
  })

  it('accepts skill filter', () => {
    const result = searchAgentsSchema.safeParse({ skill: 'coding' })
    expect(result.success).toBe(true)
  })

  it('accepts tool_id as uuid', () => {
    expect(searchAgentsSchema.safeParse({ tool_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-uuid tool_id', () => {
    expect(searchAgentsSchema.safeParse({ tool_id: 'not-a-uuid' }).success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = searchAgentsSchema.safeParse({ limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })
})

describe('acknowledgeOnboardingSchema', () => {
  it('accepts valid version', () => {
    expect(acknowledgeOnboardingSchema.safeParse({ prompt_version: 1 }).success).toBe(true)
  })

  it('rejects zero', () => {
    expect(acknowledgeOnboardingSchema.safeParse({ prompt_version: 0 }).success).toBe(false)
  })

  it('rejects negative', () => {
    expect(acknowledgeOnboardingSchema.safeParse({ prompt_version: -1 }).success).toBe(false)
  })

  it('rejects non-integer', () => {
    expect(acknowledgeOnboardingSchema.safeParse({ prompt_version: 1.5 }).success).toBe(false)
  })

  it('rejects missing field', () => {
    expect(acknowledgeOnboardingSchema.safeParse({}).success).toBe(false)
  })
})
