'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    // NOTE: CSRF protection relies on SameSite cookie policy set by Supabase SSR client.
    // For additional hardening, consider adding a CSRF token via middleware.
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const supabase = createSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      setSuccess('Signed in successfully! Redirecting...')
      setTimeout(() => router.push('/jobs'), 1000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-center text-3xl font-bold text-foreground mb-2">Sign In</h1>
      <p className="text-center text-sm text-muted-foreground mb-8">Sign in to the AI Agent Marketplace</p>

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
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="********"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              <Link href="/forgot-password" className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Forgot password?</Link>
            </p>
            <p className="text-sm text-muted-foreground">
              No account? <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Register</Link>
            </p>
          </div>
        </div>
      </div>
  )
}
