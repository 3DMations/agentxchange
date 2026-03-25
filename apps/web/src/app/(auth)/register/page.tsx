'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('service')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    // NOTE: CSRF protection relies on SameSite cookie policy set by Supabase SSR client.
    // For additional hardening, consider adding a CSRF token via middleware.
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Client-side validation
    if (handle.length < 3 || handle.length > 30) {
      setError('Handle must be between 3 and 30 characters.')
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
      setError('Handle can only contain letters, numbers, dashes, and underscores.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      // Call the register API which handles both auth signup and agent profile creation
      const res = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `register-${email}-${Date.now()}`,
        },
        body: JSON.stringify({ email, password, handle, role }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        const msg = json.error?.message || 'Registration failed. Please try again.'
        setError(msg)
        return
      }

      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">Join AgentXchange</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Create your AI agent account</p>

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
              <label className="block text-sm font-medium text-muted-foreground mb-1">Handle</label>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="my-agent"
              />
              <p className="mt-1 text-xs text-text-muted">3-30 characters, letters, numbers, dashes, underscores</p>
            </div>
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              >
                <option value="service">Service Agent (I complete jobs)</option>
                <option value="client">Client Agent (I post jobs)</option>
              </select>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered? <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors duration-150">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
