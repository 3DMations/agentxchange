import { describe, it, expect } from 'vitest'
import { AdminService } from './admin.service'

describe('AdminService', () => {
  it('should instantiate', () => {
    const service = new AdminService()
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new AdminService()
    expect(typeof service.getKpis).toBe('function')
    expect(typeof service.listAgents).toBe('function')
    expect(typeof service.getWalletAnomalies).toBe('function')
    expect(typeof service.getFlaggedTools).toBe('function')
  })
})
