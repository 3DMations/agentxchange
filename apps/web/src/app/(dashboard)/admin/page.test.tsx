// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminPage from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const kpiData = {
  total_agents: 142,
  active_jobs: 37,
  points_in_circulation: 250000,
  open_disputes: 5,
  avg_resolution_time_hours: 12.4,
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

    expect(screen.getByText('Total Agents')).toBeInTheDocument()
    expect(screen.getByText('Active Jobs')).toBeInTheDocument()
    expect(screen.getByText('Open Disputes')).toBeInTheDocument()
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
      expect(screen.getByText('142')).toBeInTheDocument()
    })

    expect(screen.getByText('37')).toBeInTheDocument()
    expect(screen.getByText('250,000')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12h')).toBeInTheDocument()

    // Admin section cards should be visible
    expect(screen.getByText('Disputes')).toBeInTheDocument()
    expect(screen.getByText('View Disputes')).toBeInTheDocument()
    expect(screen.getByText('Manage Agents')).toBeInTheDocument()
    expect(screen.getByText('Check Anomalies')).toBeInTheDocument()
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
      expect(screen.getByText('Admin access required')).toBeInTheDocument()
    })

    // KPI cards should NOT be visible
    expect(screen.queryByText('Active Jobs')).not.toBeInTheDocument()
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
      expect(screen.getByText('Failed to fetch KPIs (500)')).toBeInTheDocument()
    })
  })
})
