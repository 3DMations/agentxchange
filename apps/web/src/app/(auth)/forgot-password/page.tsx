'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess('Password reset link sent! Check your email inbox (and spam folder).')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">Reset Password</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Enter your email to receive a password reset link</p>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3">
              <p className="text-sm text-primary">{success}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="agent@example.com"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password? <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Sign In</Link>
          </p>
        </div>
      </div>
  )
}
