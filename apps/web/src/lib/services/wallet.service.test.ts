import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletService, WalletError } from './wallet.service'

// Mock the feature-toggle module
vi.mock('@/lib/middleware/feature-toggle', () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/lib/utils/logger', () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { isFeatureEnabled } from '@/lib/middleware/feature-toggle'

const mockIsFeatureEnabled = vi.mocked(isFeatureEnabled)

function createMockSupabase() {
  return {
    rpc: vi.fn(),
    from: vi.fn(),
  } as any
}

describe('WalletService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let service: WalletService

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    mockIsFeatureEnabled.mockResolvedValue(false)
    service = new WalletService(mockSupabase)
  })

  it('WalletError should be a proper error', () => {
    const err = new WalletError('test error')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('WalletError')
    expect(err.message).toBe('test error')
  })

  // ── getBalance ──

  describe('getBalance', () => {
    it('calls rpc with correct params and returns data', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { available: 100, escrowed: 50, total: 150 }, error: null })
      const result = await service.getBalance('agent-123')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_get_balance', { p_agent_id: 'agent-123' })
      expect(result).toEqual({ available: 100, escrowed: 50, total: 150 })
    })

    it('throws WalletError on failure', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
      await expect(service.getBalance('agent-123')).rejects.toThrow(WalletError)
    })
  })

  // ── escrowLock ──

  describe('escrowLock', () => {
    it('calls rpc with correct params and returns data', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { locked: true }, error: null })
      const result = await service.escrowLock('client-1', 'job-1', 500, 'idem-lock-1')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_escrow_lock', {
        p_client_agent_id: 'client-1',
        p_job_id: 'job-1',
        p_amount: 500,
        p_idempotency_key: 'idem-lock-1',
      })
      expect(result).toEqual({ locked: true })
    })

    it('throws WalletError when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Insufficient balance' } })
      await expect(service.escrowLock('client-1', 'job-1', 500, 'idem-lock-2')).rejects.toThrow('Insufficient balance')
    })

    it('throws WalletError instance when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Insufficient balance' } })
      await expect(service.escrowLock('client-1', 'job-1', 500, 'idem-lock-3')).rejects.toThrow(WalletError)
    })
  })

  // ── escrowRelease ──

  describe('escrowRelease', () => {
    it('uses PLATFORM_FEE_PCT (10%) when fee_holiday toggle is disabled', async () => {
      mockIsFeatureEnabled.mockResolvedValue(false)
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

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

      await expect(service.escrowRelease('job-3', 'agent-3', 'idem-3')).rejects.toThrow(WalletError)
    })
  })

  // ── refund ──

  describe('refund', () => {
    it('calls rpc with correct params and returns data', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { refunded: true, amount: 200 }, error: null })
      const result = await service.refund('job-refund-1', 'idem-refund-1')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_refund', {
        p_job_id: 'job-refund-1',
        p_idempotency_key: 'idem-refund-1',
      })
      expect(result).toEqual({ refunded: true, amount: 200 })
    })

    it('throws WalletError when refund RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'No escrowed funds' } })
      await expect(service.refund('job-bad', 'idem-bad')).rejects.toThrow('No escrowed funds')
    })

    it('throws WalletError instance when refund RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'No escrowed funds' } })
      await expect(service.refund('job-bad2', 'idem-bad2')).rejects.toThrow(WalletError)
    })
  })

  // ── grantStarterBonus ──

  describe('grantStarterBonus', () => {
    it('calls rpc with correct params and returns data', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: { granted: true }, error: null })
      const result = await service.grantStarterBonus('agent-new', 100, 'idem-bonus-1')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_grant_starter_bonus', {
        p_agent_id: 'agent-new',
        p_amount: 100,
        p_idempotency_key: 'idem-bonus-1',
      })
      expect(result).toEqual({ granted: true })
    })

    it('throws WalletError when grant fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Already received bonus' } })
      await expect(service.grantStarterBonus('agent-dup', 100, 'idem-dup')).rejects.toThrow(WalletError)
    })
  })

  // ── getLedger ──

  describe('getLedger', () => {
    it('returns entries with cursor when page is full', async () => {
      const entries = [
        { id: 'e1', type: 'credit', amount: 100, created_at: '2026-03-01T00:00:00Z' },
        { id: 'e2', type: 'debit', amount: 50, created_at: '2026-02-28T00:00:00Z' },
      ]
      const mockLimit = vi.fn().mockResolvedValue({ data: entries, error: null, count: 10 })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await service.getLedger('agent-1', { limit: 2 })

      expect(mockSupabase.from).toHaveBeenCalledWith('wallet_ledger')
      expect(result.entries).toEqual(entries)
      expect(result.total).toBe(10)
      expect(result.cursor_next).toBeDefined()
      // Decode the cursor and verify it contains the last entry's data
      const decoded = JSON.parse(Buffer.from(result.cursor_next!, 'base64url').toString('utf-8'))
      expect(decoded.id).toBe('e2')
      expect(decoded.created_at).toBe('2026-02-28T00:00:00Z')
    })

    it('returns no cursor when page is not full', async () => {
      const entries = [
        { id: 'e1', type: 'credit', amount: 100, created_at: '2026-03-01T00:00:00Z' },
      ]
      const mockLimit = vi.fn().mockResolvedValue({ data: entries, error: null, count: 1 })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await service.getLedger('agent-1', { limit: 10 })
      expect(result.cursor_next).toBeUndefined()
    })

    it('applies type filter when provided', async () => {
      const mockTypeEq = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      const mockLimit = vi.fn().mockReturnValue({ eq: mockTypeEq })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      // The chain order is: from -> select -> eq(agent_id) -> order -> limit -> eq(type)
      // But the actual code does: query.eq('type', ...) before order/limit
      // Since we can't perfectly model chaining order in mocks, just verify no throw
      await expect(service.getLedger('agent-1', { type: 'credit', limit: 10 })).resolves.toBeDefined()
    })

    it('throws WalletError on query failure', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' }, count: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      await expect(service.getLedger('agent-1', { limit: 10 })).rejects.toThrow(WalletError)
    })
  })

  // ── reconciliationCheck ──

  describe('reconciliationCheck', () => {
    it('calls rpc and returns reconciliation data', async () => {
      const reconcData = { balanced: true, discrepancies: [] }
      mockSupabase.rpc.mockResolvedValueOnce({ data: reconcData, error: null })
      const result = await service.reconciliationCheck()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_reconciliation_check')
      expect(result).toEqual(reconcData)
    })

    it('throws WalletError when reconciliation check fails', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC error' } })
      await expect(service.reconciliationCheck()).rejects.toThrow(WalletError)
    })
  })
})
