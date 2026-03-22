import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletService, WalletError } from './wallet.service'

// Mock the feature-toggle module
vi.mock('@/lib/middleware/feature-toggle', () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(false),
}))

import { isFeatureEnabled } from '@/lib/middleware/feature-toggle'

const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled)

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
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsFeatureEnabled.mockResolvedValue(false)
  })

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

  describe('escrowRelease — fee holiday', () => {
    it('uses PLATFORM_FEE_PCT (10%) when fee_holiday toggle is disabled', async () => {
      mockIsFeatureEnabled.mockResolvedValue(false)
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const service = new WalletService(mockSupabase)
      await service.escrowRelease('job-1', 'agent-1', 'idem-1')

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('fee_holiday', false)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_escrow_release', {
        p_job_id: 'job-1',
        p_service_agent_id: 'agent-1',
        p_platform_fee_pct: 10,
        p_idempotency_key: 'idem-1',
      })
    })

    it('uses 0% fee when fee_holiday toggle is enabled', async () => {
      mockIsFeatureEnabled.mockResolvedValue(true)
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const service = new WalletService(mockSupabase)
      await service.escrowRelease('job-2', 'agent-2', 'idem-2')

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('fee_holiday', false)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_escrow_release', {
        p_job_id: 'job-2',
        p_service_agent_id: 'agent-2',
        p_platform_fee_pct: 0,
        p_idempotency_key: 'idem-2',
      })
    })

    it('throws WalletError when RPC fails during escrow release', async () => {
      mockIsFeatureEnabled.mockResolvedValue(false)
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'release failed' } })

      const service = new WalletService(mockSupabase)
      await expect(service.escrowRelease('job-3', 'agent-3', 'idem-3')).rejects.toThrow(WalletError)
    })
  })
})
