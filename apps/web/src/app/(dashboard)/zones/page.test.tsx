// @vitest-environment jsdom
import React from 'react'
import '@testing-library/jest-dom/vitest'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ZonesPage from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const MOCK_ZONES = [
  {
    id: '1',
    zone_name: 'starter',
    level_min: 1,
    level_max: 10,
    job_point_cap: 50,
    visibility_rules: {},
    active: true,
  },
  {
    id: '2',
    zone_name: 'apprentice',
    level_min: 11,
    level_max: 25,
    job_point_cap: 200,
    visibility_rules: {},
    active: true,
  },
  {
    id: '3',
    zone_name: 'expert',
    level_min: 51,
    level_max: 100,
    job_point_cap: 5000,
    visibility_rules: {},
    active: true,
  },
  {
    id: '4',
    zone_name: 'master',
    level_min: 101,
    level_max: 9999,
    job_point_cap: 999999,
    visibility_rules: {},
    active: true,
  },
]

function mockFetchSuccess(data: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data, error: null }),
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

function mockFetchFailure() {
  const fn = vi.fn().mockRejectedValue(new Error('Network error'))
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('ZonesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state initially', () => {
    // Fetch never resolves so we stay in loading state
    const fn = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', fn)

    render(<ZonesPage />)
    expect(screen.getByText('Loading zones...')).toBeInTheDocument()
  })

  it('renders zones after successful fetch', async () => {
    mockFetchSuccess(MOCK_ZONES)

    render(<ZonesPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading zones...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Apprentice')).toBeInTheDocument()
    expect(screen.getByText('Expert')).toBeInTheDocument()
    expect(screen.getByText('Master')).toBeInTheDocument()

    // Check level formatting
    expect(screen.getByText('1-10')).toBeInTheDocument()
    expect(screen.getByText('11-25')).toBeInTheDocument()
    expect(screen.getByText('51-100')).toBeInTheDocument()
    expect(screen.getByText('101+')).toBeInTheDocument()
  })

  it('falls back to static data on fetch failure', async () => {
    mockFetchFailure()

    render(<ZonesPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading zones...')).not.toBeInTheDocument()
    })

    // Fallback zone names
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Apprentice')).toBeInTheDocument()
    expect(screen.getByText('Journeyman')).toBeInTheDocument()
    expect(screen.getByText('Expert')).toBeInTheDocument()
    expect(screen.getByText('Master')).toBeInTheDocument()

    // Fallback caps
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
  })

  it('formats caps correctly (toLocaleString, Unlimited for large values)', async () => {
    mockFetchSuccess(MOCK_ZONES)

    render(<ZonesPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading zones...')).not.toBeInTheDocument()
    })

    // Small caps rendered with toLocaleString (50, 200 stay the same)
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()

    // 5000 formatted with toLocaleString => "5,000"
    expect(screen.getByText((5000).toLocaleString())).toBeInTheDocument()

    // 999999 should display as "Unlimited"
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
  })
})
