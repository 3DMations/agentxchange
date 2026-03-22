// @vitest-environment jsdom
import React from 'react'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MarketplaceHome from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

function mockFetchResponses(overrides: Partial<Record<string, any>> = {}) {
  const defaults: Record<string, any> = {
    '/api/v1/requests?limit=5': {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          jobs: [
            { id: 'j1', description: 'Build a REST API', status: 'open', created_at: '2026-03-20T10:00:00Z' },
            { id: 'j2', description: 'Data pipeline setup', status: 'in_progress', created_at: '2026-03-19T08:00:00Z' },
          ],
        },
        error: null,
      }),
    },
    '/api/v1/agents/search?limit=5': {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          agents: [
            { id: 'a1', handle: 'coder-bot', zone: 'build', trust_tier: 'gold' },
            { id: 'a2', handle: 'data-wiz', zone: 'analyze', trust_tier: 'silver' },
          ],
        },
        error: null,
      }),
    },
    '/api/v1/wallet/balance': {
      ok: true,
      status: 200,
      json: async () => ({
        data: { available: 1500, escrowed: 200, total: 1700 },
        error: null,
      }),
    },
  }

  const responses = { ...defaults, ...overrides }

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const match = responses[url]
      if (match) return Promise.resolve(match)
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'Not found' }) })
    }),
  )
}

describe('MarketplaceHome', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially with -- in StatCards', () => {
    // Never-resolving fetch so we stay in loading
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    render(<MarketplaceHome />)

    // StatCards should show '--' while loading
    const dashes = screen.getAllByText('--')
    expect(dashes.length).toBeGreaterThanOrEqual(3)

    // Loading subtexts
    const loadingTexts = screen.getAllByText('Loading...')
    expect(loadingTexts.length).toBeGreaterThanOrEqual(1)
  })

  it('renders data after successful fetch', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('Build a REST API')).toBeTruthy()
    })

    // Job descriptions
    expect(screen.getByText('Data pipeline setup')).toBeTruthy()

    // Agent handles
    expect(screen.getByText(/coder-bot/)).toBeTruthy()
    expect(screen.getByText(/data-wiz/)).toBeTruthy()

    // Balance
    expect(screen.getByText('1,500 pts')).toBeTruthy()

    // StatCard values (may match multiple elements)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })

  it('handles partial failures gracefully (one endpoint fails, others still render)', async () => {
    mockFetchResponses({
      '/api/v1/wallet/balance': {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      },
    })

    render(<MarketplaceHome />)

    // Jobs and agents should still render
    await waitFor(() => {
      expect(screen.getByText('Build a REST API')).toBeTruthy()
    })

    expect(screen.getByText(/coder-bot/)).toBeTruthy()
    expect(screen.getByText(/data-wiz/)).toBeTruthy()

    // Balance should fall back to '--' since wallet fetch failed
    const balanceCard = screen.getByText('Your Balance').closest('div')!
    expect(balanceCard).toBeTruthy()
    // The balance value should be '--' (not a points value)
    expect(screen.queryByText(/pts/)).toBeNull()
  })
})
