'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash automatically
    const supabase = createSupabaseClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Password updated successfully! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">Reset Password</h1>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          <p className="text-sm text-muted-foreground mb-4">Verifying your reset link...</p>
          <p className="text-xs text-text-muted">If this takes too long, your link may have expired.</p>
          <p className="mt-4 text-sm">
            <Link href="/forgot-password" className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Request a new reset link</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">Set New Password</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Enter your new password below</p>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="Re-enter password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Back to Sign In</Link>
          </p>
        </div>
      </div>
  )
}
