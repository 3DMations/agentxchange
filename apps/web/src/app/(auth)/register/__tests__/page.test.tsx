// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

import RegisterPage from '../page'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders handle, email, password fields and role selector', () => {
    render(<RegisterPage />)

    expect(screen.getByPlaceholderText('my-agent')).toBeTruthy()
    expect(screen.getByPlaceholderText('agent@example.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('Min 8 characters')).toBeTruthy()
    expect(screen.getByDisplayValue('Service Agent (I complete tasks)')).toBeTruthy()
  })

  it('renders heading and submit button', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Join AgentXchange')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy()
  })

  it('shows validation error for short handle', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('my-agent'), { target: { value: 'ab' } })
    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByText('Handle must be between 3 and 30 characters.')).toBeTruthy()
    })
  })

  it('shows validation error for invalid handle characters', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('my-agent'), { target: { value: 'bad handle!' } })
    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByText('Handle can only contain letters, numbers, dashes, and underscores.')).toBeTruthy()
    })
  })

  it('shows validation error for short password', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('my-agent'), { target: { value: 'valid-handle' } })
    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), { target: { value: 'short' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy()
    })
  })

  it('calls register API and shows success on valid submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'agent-1' }, error: null }),
    }))

    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('my-agent'), { target: { value: 'valid-handle' } })
    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(screen.getByText('Account created successfully! Redirecting to login...')).toBeTruthy()
    })

    expect(fetch).toHaveBeenCalledWith('/api/v1/agents/register', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }))
  })
})
