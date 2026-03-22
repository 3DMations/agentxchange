// @vitest-environment jsdom
import React from 'react'
import '@testing-library/jest-dom/vitest'
import type { Mock } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import JobsPage from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const mockJobs = [
  {
    id: 'job-1',
    description: 'Build a REST API for user management',
    status: 'open',
    point_budget: 500,
    zone_at_creation: 'expert',
    created_at: '2026-03-20T10:00:00Z',
    acceptance_criteria: 'Must pass all tests',
  },
  {
    id: 'job-2',
    description: 'Design a landing page',
    status: 'completed',
    point_budget: 200,
    zone_at_creation: 'starter',
    created_at: '2026-03-18T08:00:00Z',
    acceptance_criteria: 'Responsive design',
  },
]

function mockFetchSuccess(jobs = mockJobs) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { jobs } }),
  })
}

function mockFetchError(status = 500) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
  })
}

describe('JobsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    // Fetch that never resolves to keep loading state visible
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    render(<JobsPage />)

    expect(screen.getByText('Loading jobs...')).toBeInTheDocument()
  })

  it('renders jobs after successful fetch', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess())

    render(<JobsPage />)

    await waitFor(() => {
      expect(screen.getByText('Build a REST API for user management')).toBeInTheDocument()
    })

    expect(screen.getByText('Design a landing page')).toBeInTheDocument()
    expect(screen.getByText('500 pts')).toBeInTheDocument()
    expect(screen.getByText('200 pts')).toBeInTheDocument()
    expect(screen.getByText('Zone: expert')).toBeInTheDocument()
    expect(screen.getByText('Zone: starter')).toBeInTheDocument()
    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.queryByText('Loading jobs...')).not.toBeInTheDocument()
  })

  it('shows error message on fetch failure', async () => {
    vi.stubGlobal('fetch', mockFetchError(500))

    render(<JobsPage />)

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch jobs (500)')).toBeInTheDocument()
    })

    expect(screen.queryByText('Loading jobs...')).not.toBeInTheDocument()
  })

  it('shows "No jobs found." when API returns empty array', async () => {
    vi.stubGlobal('fetch', mockFetchSuccess([]))

    render(<JobsPage />)

    await waitFor(() => {
      expect(screen.getByText('No jobs found.')).toBeInTheDocument()
    })

    expect(screen.queryByText('Loading jobs...')).not.toBeInTheDocument()
  })

  it('filters trigger re-fetch with correct query params', async () => {
    const fetchMock = mockFetchSuccess()
    vi.stubGlobal('fetch', fetchMock)

    render(<JobsPage />)

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading jobs...')).not.toBeInTheDocument()
    })

    // Initial fetch should have been called without query params
    expect((fetchMock as Mock).mock.calls[0]![0]).toBe('/api/v1/requests')

    // Change status filter
    const statusSelect = screen.getByDisplayValue('All Statuses')
    fireEvent.change(statusSelect, { target: { value: 'open' } })

    await waitFor(() => {
      const calls = (fetchMock as Mock).mock.calls
      const lastUrl = calls[calls.length - 1]![0]
      expect(lastUrl).toContain('status=open')
    })

    // Change zone filter
    const zoneSelect = screen.getByDisplayValue('All Zones')
    fireEvent.change(zoneSelect, { target: { value: 'expert' } })

    await waitFor(() => {
      const calls = (fetchMock as Mock).mock.calls
      const lastUrl = calls[calls.length - 1]![0]
      expect(lastUrl).toContain('status=open')
      expect(lastUrl).toContain('zone=expert')
    })

    // Set min budget
    const minBudgetInput = screen.getByPlaceholderText('Min budget')
    fireEvent.change(minBudgetInput, { target: { value: '100' } })

    await waitFor(() => {
      const calls = (fetchMock as Mock).mock.calls
      const lastUrl = calls[calls.length - 1]![0]
      expect(lastUrl).toContain('min_budget=100')
    })

    // Set max budget
    const maxBudgetInput = screen.getByPlaceholderText('Max budget')
    fireEvent.change(maxBudgetInput, { target: { value: '1000' } })

    await waitFor(() => {
      const calls = (fetchMock as Mock).mock.calls
      const lastUrl = calls[calls.length - 1]![0]
      expect(lastUrl).toContain('max_budget=1000')
    })
  })
})
