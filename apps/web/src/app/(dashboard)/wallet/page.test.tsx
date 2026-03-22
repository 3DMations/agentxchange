// @vitest-environment jsdom
import React from 'react'
import '@testing-library/jest-dom/vitest'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import WalletPage from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const mockBalance = {
  data: { available: 500, escrowed: 100, total: 600 },
  error: null,
}

const mockLedger = {
  data: [
    {
      id: 'txn-001',
      type: 'credit',
      amount: 500,
      balance_after: 500,
      job_id: 'job-abc12345-6789',
      created_at: '2026-03-20T10:00:00Z',
    },
    {
      id: 'txn-002',
      type: 'debit',
      amount: 50,
      balance_after: 450,
      job_id: null,
      created_at: '2026-03-21T14:30:00Z',
    },
    {
      id: 'txn-003',
      type: 'escrow_lock',
      amount: 100,
      balance_after: 350,
      job_id: 'job-def98765-4321',
      created_at: '2026-03-22T09:15:00Z',
    },
    {
      id: 'txn-004',
      type: 'starter_bonus',
      amount: 250,
      balance_after: 600,
      job_id: null,
      created_at: '2026-03-22T12:00:00Z',
    },
  ],
  error: null,
}

function createFetchMock(overrides?: {
  balance?: any
  ledger?: any
  balanceOk?: boolean
  ledgerOk?: boolean
  balanceStatus?: number
  ledgerStatus?: number
}) {
  const {
    balance = mockBalance,
    ledger = mockLedger,
    balanceOk = true,
    ledgerOk = true,
    balanceStatus = 200,
    ledgerStatus = 200,
  } = overrides || {}

  return vi.fn((url: string) => {
    if (url.includes('/api/v1/wallet/balance')) {
      return Promise.resolve({
        ok: balanceOk,
        status: balanceStatus,
        json: () => Promise.resolve(balance),
      })
    }
    if (url.includes('/api/v1/wallet/ledger')) {
      return Promise.resolve({
        ok: ledgerOk,
        status: ledgerStatus,
        json: () => Promise.resolve(ledger),
      })
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('WalletPage', () => {
  it('shows loading state initially', () => {
    // Never-resolving fetch to keep loading state
    global.fetch = vi.fn(() => new Promise(() => {})) as any

    render(<WalletPage />)

    expect(screen.getByText('Loading wallet data...')).toBeInTheDocument()
  })

  it('renders balance and transactions after successful fetch', async () => {
    global.fetch = createFetchMock() as any

    render(<WalletPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading wallet data...')).not.toBeInTheDocument()
    })

    // Balance stat cards (may appear in both StatCard and ledger)
    expect(screen.getAllByText('500').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('100').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('600').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('In Escrow')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()

    // Transaction rows
    expect(screen.getByText('credit')).toBeInTheDocument()
    expect(screen.getByText('debit')).toBeInTheDocument()
    expect(screen.getByText('escrow lock')).toBeInTheDocument()
    expect(screen.getByText('starter bonus')).toBeInTheDocument()

    // Job IDs (truncated)
    expect(screen.getByText('job-abc1...')).toBeInTheDocument()
    expect(screen.getByText('job-def9...')).toBeInTheDocument()

    // Null job_id renders --
    const dashes = screen.getAllByText('--')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('shows error on fetch failure', async () => {
    global.fetch = createFetchMock({
      balanceOk: false,
      balanceStatus: 500,
    }) as any

    render(<WalletPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
    })

    expect(screen.getByText(/Failed to fetch balance: 500/)).toBeInTheDocument()
  })

  it('shows error when API returns error in response body', async () => {
    global.fetch = createFetchMock({
      balance: { data: null, error: 'Unauthorized' },
    }) as any

    render(<WalletPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error:.*Unauthorized/)).toBeInTheDocument()
    })
  })

  it('shows "No transactions yet" when ledger is empty', async () => {
    global.fetch = createFetchMock({
      ledger: { data: [], error: null },
    }) as any

    render(<WalletPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading wallet data...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
  })

  it('formats amounts correctly with +/- prefix based on type', async () => {
    global.fetch = createFetchMock() as any

    render(<WalletPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading wallet data...')).not.toBeInTheDocument()
    })

    // credit (500) -> +500
    expect(screen.getByText('+500')).toBeInTheDocument()
    // debit (50) -> -50
    expect(screen.getByText('-50')).toBeInTheDocument()
    // escrow_lock (100) -> -100
    expect(screen.getByText('-100')).toBeInTheDocument()
    // starter_bonus (250) -> +250
    expect(screen.getByText('+250')).toBeInTheDocument()
  })
})
