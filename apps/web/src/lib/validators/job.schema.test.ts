import { describe, it, expect } from 'vitest'
import { createJobSchema, acceptJobSchema, submitJobSchema, rateJobSchema, searchJobsSchema } from './job.schema'

describe('createJobSchema', () => {
  it('accepts valid input', () => {
    const result = createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'Must pass all tests',
      point_budget: 50,
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero budget', () => {
    expect(createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'Must pass tests',
      point_budget: 0,
    }).success).toBe(false)
  })

  it('rejects short description', () => {
    expect(createJobSchema.safeParse({
      description: 'short',
      acceptance_criteria: 'Must pass tests',
      point_budget: 50,
    }).success).toBe(false)
  })

  it('rejects short acceptance_criteria', () => {
    expect(createJobSchema.safeParse({
      description: 'A long enough description',
      acceptance_criteria: 'short',
      point_budget: 50,
    }).success).toBe(false)
  })

  it('accepts optional required_skills', () => {
    const result = createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'Must pass all tests',
      point_budget: 50,
      required_skills: ['python', 'ml'],
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional tools_required', () => {
    const result = createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'Must pass all tests',
      point_budget: 50,
      tools_required: ['tool-1'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative budget', () => {
    expect(createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'Must pass all tests',
      point_budget: -10,
    }).success).toBe(false)
  })

  it('rejects description over 5000 chars', () => {
    expect(createJobSchema.safeParse({
      description: 'x'.repeat(5001),
      acceptance_criteria: 'Must pass all tests',
      point_budget: 50,
    }).success).toBe(false)
  })

  it('rejects acceptance_criteria over 2000 chars', () => {
    expect(createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'x'.repeat(2001),
      point_budget: 50,
    }).success).toBe(false)
  })

  it('rejects non-integer budget', () => {
    expect(createJobSchema.safeParse({
      description: 'Do this task please',
      acceptance_criteria: 'Must pass all tests',
      point_budget: 10.5,
    }).success).toBe(false)
  })
})

describe('acceptJobSchema', () => {
  it('accepts valid quote', () => {
    expect(acceptJobSchema.safeParse({ point_quote: 25 }).success).toBe(true)
  })

  it('rejects zero quote', () => {
    expect(acceptJobSchema.safeParse({ point_quote: 0 }).success).toBe(false)
  })

  it('rejects negative quote', () => {
    expect(acceptJobSchema.safeParse({ point_quote: -1 }).success).toBe(false)
  })

  it('rejects non-integer quote', () => {
    expect(acceptJobSchema.safeParse({ point_quote: 2.5 }).success).toBe(false)
  })

  it('rejects missing field', () => {
    expect(acceptJobSchema.safeParse({}).success).toBe(false)
  })
})

describe('submitJobSchema', () => {
  it('accepts valid input', () => {
    expect(submitJobSchema.safeParse({
      deliverable_id: '550e8400-e29b-41d4-a716-446655440000',
    }).success).toBe(true)
  })

  it('accepts optional notes', () => {
    const result = submitJobSchema.safeParse({
      deliverable_id: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Here are my notes',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-uuid deliverable_id', () => {
    expect(submitJobSchema.safeParse({
      deliverable_id: 'not-a-uuid',
    }).success).toBe(false)
  })

  it('rejects notes over 2000 chars', () => {
    expect(submitJobSchema.safeParse({
      deliverable_id: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'x'.repeat(2001),
    }).success).toBe(false)
  })
})

describe('rateJobSchema', () => {
  it('accepts valid rating', () => {
    expect(rateJobSchema.safeParse({ helpfulness_score: 4, solved: true }).success).toBe(true)
  })

  it('rejects score > 5', () => {
    expect(rateJobSchema.safeParse({ helpfulness_score: 6, solved: true }).success).toBe(false)
  })

  it('rejects score < 1', () => {
    expect(rateJobSchema.safeParse({ helpfulness_score: 0, solved: true }).success).toBe(false)
  })

  it('requires solved boolean', () => {
    expect(rateJobSchema.safeParse({ helpfulness_score: 3 }).success).toBe(false)
  })

  it('accepts optional feedback', () => {
    const result = rateJobSchema.safeParse({ helpfulness_score: 5, solved: true, feedback: 'Great work' })
    expect(result.success).toBe(true)
  })

  it('rejects feedback over 2000 chars', () => {
    expect(rateJobSchema.safeParse({
      helpfulness_score: 5,
      solved: true,
      feedback: 'x'.repeat(2001),
    }).success).toBe(false)
  })

  it('accepts boundary scores 1 and 5', () => {
    expect(rateJobSchema.safeParse({ helpfulness_score: 1, solved: false }).success).toBe(true)
    expect(rateJobSchema.safeParse({ helpfulness_score: 5, solved: true }).success).toBe(true)
  })

  it('rejects non-integer score', () => {
    expect(rateJobSchema.safeParse({ helpfulness_score: 3.5, solved: true }).success).toBe(false)
  })
})

describe('searchJobsSchema', () => {
  it('accepts empty params', () => {
    expect(searchJobsSchema.safeParse({}).success).toBe(true)
  })

  it('accepts valid status', () => {
    expect(searchJobsSchema.safeParse({ status: 'open' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(searchJobsSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })

  it('defaults limit to 20', () => {
    const result = searchJobsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(20)
  })

  it('accepts all valid statuses', () => {
    const statuses = ['open', 'accepted', 'in_progress', 'submitted', 'under_review', 'completed', 'disputed', 'cancelled']
    for (const status of statuses) {
      expect(searchJobsSchema.safeParse({ status }).success).toBe(true)
    }
  })

  it('accepts zone filter', () => {
    expect(searchJobsSchema.safeParse({ zone: 'starter' }).success).toBe(true)
  })

  it('accepts budget range filters', () => {
    const result = searchJobsSchema.safeParse({ min_budget: '10', max_budget: '100' })
    expect(result.success).toBe(true)
  })

  it('rejects limit over 100', () => {
    expect(searchJobsSchema.safeParse({ limit: '200' }).success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = searchJobsSchema.safeParse({ limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })
})
