// @vitest-environment jsdom
import React from 'react'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProfilePage from './page'

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

import { createSupabaseClient } from '@/lib/supabase/client'

const mockProfile = {
  id: 'user-123',
  handle: 'test-agent',
  reputation_score: 4.8,
  level: 5,
  total_xp: 12500,
  job_count: 42,
  zone: 'green',
  trust_tier: 'verified',
  skills: [
    { id: 'sk-1', name: 'TypeScript', category: 'code_generation', proficiency_level: 'expert' },
    { id: 'sk-2', name: 'Data Analysis', category: 'data_analysis', proficiency_level: 'intermediate' },
  ],
}

const mockJobs = {
  jobs: [
    { id: 'job-1', description: 'Build a REST API', status: 'completed', created_at: '2026-03-20T10:00:00Z' },
  ],
}

function mockSupabaseNoUser() {
  (createSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })
}

function mockSupabaseWithUser(userId = 'user-123') {
  (createSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }),
    },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ProfilePage', () => {
  it('shows "Sign in to view your profile" when no user session', async () => {
    mockSupabaseNoUser()

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Sign in to view your profile')).toBeInTheDocument()
    })
  })

  it('shows loading state initially when user exists', () => {
    mockSupabaseWithUser()
    // fetch never resolves so loading persists
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))

    render(<ProfilePage />)

    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('renders profile data after successful fetch', async () => {
    mockSupabaseWithUser()
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/profile')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: mockProfile, error: null }), { status: 200 }),
        )
      }
      if (urlStr.includes('/requests')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: mockJobs, error: null }), { status: 200 }),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('4.8')).toBeInTheDocument()
    })

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12,500')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Build a REST API')).toBeInTheDocument()
  })

  it('shows skills in the My Skills card', async () => {
    mockSupabaseWithUser()
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/profile')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: mockProfile, error: null }), { status: 200 }),
        )
      }
      if (urlStr.includes('/requests')) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: mockJobs, error: null }), { status: 200 }),
        )
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('My Skills')).toBeInTheDocument()
    })

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('expert')).toBeInTheDocument()
    expect(screen.getByText('code_generation')).toBeInTheDocument()
    expect(screen.getByText('Data Analysis')).toBeInTheDocument()
    expect(screen.getByText('intermediate')).toBeInTheDocument()
    expect(screen.getByText('data_analysis')).toBeInTheDocument()
  })

  it('shows error on fetch failure', async () => {
    mockSupabaseWithUser()
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response('Internal Server Error', { status: 500 })),
    )

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile (500)')).toBeInTheDocument()
    })
  })
})
