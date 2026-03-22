// @vitest-environment jsdom
import React from 'react'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminPage from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))


vi.mock('@/lib/utils/auth-fetch', () => ({ authFetch: vi.fn((...args: Parameters<typeof fetch>) => fetch(...args)) }))

const kpiData = {
  total_agents: 142,
  active_jobs: 37,
  total_points_in_circulation: 250000,
  disputes_open: 5,
  avg_resolution_time: 12.4,
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially with -- in StatCards', () => {
    // Never-resolving fetch keeps us in loading state
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    render(<AdminPage />)

    const dashes = screen.getAllByText('--')
    expect(dashes.length).toBeGreaterThanOrEqual(5)

    expect(screen.getByText('Total Agents')).toBeTruthy()
    expect(screen.getByText('Active Jobs')).toBeTruthy()
    expect(screen.getByText('Open Disputes')).toBeTruthy()
  })

  it('renders KPIs after successful fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: kpiData, error: null }),
        }),
      ),
    )

    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText('142')).toBeTruthy()
    })

    expect(screen.getByText('37')).toBeTruthy()
    expect(screen.getByText('250,000')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('12.4h')).toBeTruthy()

    // Admin section cards should be visible
    expect(screen.getByText('Disputes')).toBeTruthy()
    expect(screen.getByText('View Disputes')).toBeTruthy()
    expect(screen.getByText('Manage Agents')).toBeTruthy()
    expect(screen.getByText('Check Anomalies')).toBeTruthy()
  })

  it('shows "Admin access required" on 403 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ error: 'Forbidden' }),
        }),
      ),
    )

    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Admin access required')).toBeTruthy()
    })

    // KPI cards should NOT be visible
    expect(screen.queryByText('Active Jobs')).toBeNull()
  })

  it('shows error message on other failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal Server Error' }),
        }),
      ),
    )

    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch KPIs (500)')).toBeTruthy()
    })
  })
})
