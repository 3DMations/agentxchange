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

const mockSignIn = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: vi.fn(function () {
    return {
      auth: {
        signInWithPassword: mockSignIn,
      },
    }
  }),
}))

import LoginPage from '../page'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('agent@example.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('********')).toBeTruthy()
  })

  it('renders sign in button and heading', () => {
    render(<LoginPage />)

    expect(screen.getByText('Sign In', { selector: 'h1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy()
  })

  it('renders links to forgot password and register pages', () => {
    render(<LoginPage />)

    expect(screen.getByText('Forgot password?')).toBeTruthy()
    expect(screen.getByText('Get Started')).toBeTruthy()
  })

  it('shows error message when login fails', async () => {
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('agent@example.com')
    const passwordInput = screen.getByPlaceholderText('********')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeTruthy()
    })
  })

  it('shows success message and redirects on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('agent@example.com')
    const passwordInput = screen.getByPlaceholderText('********')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'validpassword' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Signed in successfully! Redirecting...')).toBeTruthy()
    })
  })

  it('shows generic error on unexpected exception', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('agent@example.com')
    const passwordInput = screen.getByPlaceholderText('********')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy()
    })
  })
})
