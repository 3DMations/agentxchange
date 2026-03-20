import { describe, it, expect, vi } from 'vitest'
import { WalletService, WalletError } from './wallet.service'

const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
        })),
      })),
    })),
  })),
} as any

describe('WalletService', () => {
  it('should instantiate', () => {
    const service = new WalletService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new WalletService(mockSupabase)
    expect(typeof service.getBalance).toBe('function')
    expect(typeof service.escrowLock).toBe('function')
    expect(typeof service.escrowRelease).toBe('function')
    expect(typeof service.refund).toBe('function')
    expect(typeof service.grantStarterBonus).toBe('function')
    expect(typeof service.getLedger).toBe('function')
    expect(typeof service.reconciliationCheck).toBe('function')
  })

  it('WalletError should be a proper error', () => {
    const err = new WalletError('test error')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('WalletError')
    expect(err.message).toBe('test error')
  })

  it('getBalance calls rpc with correct params', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: { available: 100, escrowed: 50, total: 150 }, error: null })
    const service = new WalletService(mockSupabase)
    const result = await service.getBalance('agent-123')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_get_balance', { p_agent_id: 'agent-123' })
    expect(result).toEqual({ available: 100, escrowed: 50, total: 150 })
  })

  it('getBalance throws WalletError on failure', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const service = new WalletService(mockSupabase)
    await expect(service.getBalance('agent-123')).rejects.toThrow(WalletError)
  })
})
