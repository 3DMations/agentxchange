// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

vi.mock('@/lib/utils/auth-fetch', () => ({
  authFetch: vi.fn((...args: Parameters<typeof fetch>) => fetch(...args)),
}))

// Import the component under test (which re-exports MarketplaceHome)
import MarketplaceHome from './page'

function mockFetchResponses(overrides: Partial<Record<string, any>> = {}) {
  const defaults: Record<string, any> = {
    '/api/v1/requests?limit=10': {
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'j1', description: 'Build a REST API', status: 'open', created_at: '2026-03-20T10:00:00Z' },
          { id: 'j2', description: 'Data pipeline setup', status: 'in_progress', created_at: '2026-03-19T08:00:00Z', assigned_agent_handle: 'data-wiz' },
          { id: 'j3', description: 'Write blog post', status: 'completed', created_at: '2026-03-18T08:00:00Z' },
        ],
        error: null,
      }),
    },
    '/api/v1/agents/search?limit=5': {
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'a1', handle: 'coder-bot', zone: 'build', trust_tier: 'gold', domain: 'Code Generation', rating_avg: 4.9 },
          { id: 'a2', handle: 'data-wiz', zone: 'analyze', trust_tier: 'silver', domain: 'Data Analysis', rating_avg: 4.8 },
        ],
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

describe('MarketplaceHome (Dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton initially', () => {
    // Never-resolving fetch so we stay in loading
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    render(<MarketplaceHome />)

    // Skeleton elements should be present (aria-hidden divs with animate-pulse)
    const skeletons = document.querySelectorAll('[aria-hidden="true"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders welcome banner and task data after fetch', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('Welcome back')).toBeTruthy()
    })

    // Welcome banner elements
    expect(screen.getByText('What do you need done today?')).toBeTruthy()
    expect(screen.getByText('New Task')).toBeTruthy()

    // Active tasks section
    expect(screen.getByText('Active Tasks')).toBeTruthy()
    expect(screen.getByText('Build a REST API')).toBeTruthy()
    expect(screen.getByText('Data pipeline setup')).toBeTruthy()

    // Expert assigned
    expect(screen.getByText('Expert: @data-wiz')).toBeTruthy()
  })

  it('renders stat cards with correct values', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeTruthy()
    })

    // Total Tasks = 3
    expect(screen.getByText('3')).toBeTruthy()

    // Completed = 1
    expect(screen.getByText('Completed')).toBeTruthy()

    // Credits balance (may appear in multiple sections)
    expect(screen.getAllByText('1,500').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('200 in escrow')).toBeTruthy()
  })

  it('renders recommended experts section', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('Recommended AI Experts')).toBeTruthy()
    })

    expect(screen.getByText('@coder-bot')).toBeTruthy()
    expect(screen.getByText('Code Generation')).toBeTruthy()
    expect(screen.getByText('4.9')).toBeTruthy()

    // Hire buttons
    const hireButtons = screen.getAllByText('Hire')
    expect(hireButtons.length).toBe(2)
  })

  it('renders recent activity feed', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeTruthy()
    })

    // Activity feed items generated from tasks (may appear in multiple sections)
    expect(screen.getAllByText(/Task posted/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no active tasks', async () => {
    mockFetchResponses({
      '/api/v1/requests?limit=10': {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 'j1', description: 'Old task', status: 'completed', created_at: '2026-03-10T10:00:00Z' },
          ],
          error: null,
        }),
      },
    })

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('No active tasks')).toBeTruthy()
    })

    expect(screen.getByText('Post Your First Task')).toBeTruthy()
  })

  it('handles partial failures gracefully', async () => {
    mockFetchResponses({
      '/api/v1/wallet/balance': {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      },
    })

    render(<MarketplaceHome />)

    // Tasks and experts should still render
    await waitFor(() => {
      expect(screen.getByText('Build a REST API')).toBeTruthy()
    })

    expect(screen.getByText('@coder-bot')).toBeTruthy()

    // Balance should fall back to '--'
    expect(screen.queryByText('1,500')).toBeNull()
  })

  it('shows mock data when all APIs fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) })
      ),
    )

    render(<MarketplaceHome />)

    await waitFor(() => {
      // Mock data notice
      expect(screen.getByText(/Showing sample data/)).toBeTruthy()
    })

    // Mock task data should be visible (may appear in multiple sections)
    expect(screen.getAllByText(/Build a REST API with authentication/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('@coder-bot')).toBeTruthy()
  })

  it('links New Task button to /new-task', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeTruthy()
    })

    const newTaskLink = screen.getByText('New Task').closest('a')
    expect(newTaskLink?.getAttribute('href')).toBe('/new-task')
  })

  it('links View All to /jobs', async () => {
    mockFetchResponses()

    render(<MarketplaceHome />)

    await waitFor(() => {
      expect(screen.getByText('View All')).toBeTruthy()
    })

    const viewAllLink = screen.getByText('View All').closest('a')
    expect(viewAllLink?.getAttribute('href')).toBe('/jobs')
  })
})
