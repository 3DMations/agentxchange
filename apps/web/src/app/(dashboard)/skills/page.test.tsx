// @vitest-environment jsdom
import React from 'react'
import type { Mock } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SkillsPage from './page'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const mockSkill = {
  id: 'skill-1',
  name: 'React Development',
  category: 'code_generation',
  domain: 'Frontend',
  description: 'Build modern React applications with hooks and TypeScript',
  proficiency_level: 'advanced',
  verified: true,
  tags: ['react', 'typescript', 'hooks'],
  point_range_min: 100,
  point_range_max: 500,
  avg_rating_for_skill: 4.8,
  jobs_completed_for_skill: 42,
}

const mockSkill2 = {
  id: 'skill-2',
  name: 'Data Wrangling',
  category: 'data_analysis',
  domain: 'Analytics',
  description: 'Clean and transform datasets for analysis',
  proficiency_level: 'intermediate',
  verified: false,
  tags: ['python', 'pandas'],
  point_range_min: 50,
  point_range_max: 300,
  avg_rating_for_skill: 4.2,
  jobs_completed_for_skill: 15,
}

function createFetchResponse(data: any, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  })
}

describe('SkillsPage', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {})) // never resolves
    render(<SkillsPage />)
    expect(screen.getByText('Loading skills...')).toBeTruthy()
  })

  it('renders skills after successful fetch', async () => {
    mockFetch.mockReturnValue(
      createFetchResponse({ data: { skills: [mockSkill, mockSkill2] } })
    )

    render(<SkillsPage />)

    await waitFor(() => {
      expect(screen.getByText('React Development')).toBeTruthy()
    })

    // Verify skill card details
    expect(screen.getByText('Data Wrangling')).toBeTruthy()
    expect(screen.getAllByText('Code Generation').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Data Analysis').length).toBeGreaterThanOrEqual(1)

    // Proficiency and domain
    expect(screen.getByText(/Frontend/)).toBeTruthy()
    expect(screen.getByText(/advanced/)).toBeTruthy()
    expect(screen.getByText(/Analytics/)).toBeTruthy()
    expect(screen.getByText(/intermediate/)).toBeTruthy()

    // Descriptions
    expect(
      screen.getByText('Build modern React applications with hooks and TypeScript')
    ).toBeTruthy()
    expect(
      screen.getByText('Clean and transform datasets for analysis')
    ).toBeTruthy()

    // Point ranges
    expect(screen.getByText('100-500 pts')).toBeTruthy()
    expect(screen.getByText('50-300 pts')).toBeTruthy()

    // Tags
    expect(screen.getByText('react')).toBeTruthy()
    expect(screen.getByText('typescript')).toBeTruthy()
    expect(screen.getByText('python')).toBeTruthy()

    // Verified checkmark — only the verified skill should have the SVG
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBe(1) // only mockSkill is verified

    // Loading should be gone
    expect(screen.queryByText('Loading skills...')).toBeNull()
  })

  it('shows error on fetch failure', async () => {
    mockFetch.mockReturnValue(
      createFetchResponse({}, false, 500)
    )

    render(<SkillsPage />)

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch skills (500)')
      ).toBeTruthy()
    })

    expect(screen.queryByText('Loading skills...')).toBeNull()
  })

  it('shows "No skills found" when empty', async () => {
    mockFetch.mockReturnValue(
      createFetchResponse({ data: { skills: [] } })
    )

    render(<SkillsPage />)

    await waitFor(() => {
      expect(screen.getByText('No skills found')).toBeTruthy()
    })

    expect(screen.queryByText('Loading skills...')).toBeNull()
  })

  it('verified checkbox filter works', async () => {
    // Initial fetch returns all skills
    mockFetch.mockReturnValue(
      createFetchResponse({ data: { skills: [mockSkill, mockSkill2] } })
    )

    render(<SkillsPage />)

    await waitFor(() => {
      expect(screen.getByText('React Development')).toBeTruthy()
    })

    // Reset mock for the next fetch triggered by checkbox
    mockFetch.mockClear()
    mockFetch.mockReturnValue(
      createFetchResponse({ data: { skills: [mockSkill] } })
    )

    // Click the verified checkbox
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Verify the fetch was called with verified=true query param
    const fetchUrl = mockFetch.mock.calls[0]![0] as string
    expect(fetchUrl).toContain('verified=true')
  })
})
