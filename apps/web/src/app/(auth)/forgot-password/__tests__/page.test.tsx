// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))

const mockResetPassword = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: vi.fn(function () {
    return {
      auth: {
        resetPasswordForEmail: mockResetPassword,
      },
    }
  }),
}))

import ForgotPasswordPage from '../page'

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />)

    expect(screen.getByText('Reset Password')).toBeTruthy()
    expect(screen.getByPlaceholderText('agent@example.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeTruthy()
  })

  it('renders link back to login page', () => {
    render(<ForgotPasswordPage />)

    const signInLink = screen.getByText('Sign In')
    expect(signInLink.getAttribute('href')).toBe('/login')
  })

  it('shows success message after successful submission', async () => {
    mockResetPassword.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }))

    await waitFor(() => {
      expect(screen.getByText('Password reset link sent! Check your email inbox (and spam folder).')).toBeTruthy()
    })

    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', expect.objectContaining({
      redirectTo: expect.stringContaining('/reset-password'),
    }))
  })

  it('shows error message when reset fails', async () => {
    mockResetPassword.mockResolvedValue({
      error: { message: 'User not found' },
    })

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), {
      target: { value: 'nonexistent@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }))

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeTruthy()
    })
  })

  it('shows generic error on unexpected exception', async () => {
    mockResetPassword.mockRejectedValue(new Error('Network failure'))

    render(<ForgotPasswordPage />)

    fireEvent.change(screen.getByPlaceholderText('agent@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }))

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy()
    })
  })
})
