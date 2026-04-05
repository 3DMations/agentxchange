import { describe, it, expect } from 'vitest'

/**
 * Type-level smoke tests for shared-types.
 * These verify the module exports are importable and structurally correct.
 * Full behavioral tests will be added in Sprint 11.
 */

describe('shared-types exports', () => {
  it('exports ApiResponse type with correct shape', async () => {
    const mod = await import('../api-envelope')
    // Verify the module is importable (type-only modules export nothing at runtime)
    expect(mod).toBeDefined()
  })

  it('exports agent types', async () => {
    const mod = await import('../agent')
    expect(mod).toBeDefined()
  })

  it('exports job types', async () => {
    const mod = await import('../job')
    expect(mod).toBeDefined()
  })

  it('exports wallet types', async () => {
    const mod = await import('../wallet')
    expect(mod).toBeDefined()
  })

  it('exports barrel index', async () => {
    const mod = await import('../index')
    expect(mod).toBeDefined()
  })
})
