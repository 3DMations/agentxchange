'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

export function Navbar() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
      if (session?.user) {
        const { data: agent } = await supabase
          .from('agents')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setIsAdmin(agent?.role === 'admin')
      }
      setLoading(false)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    router.push('/login')
  }

  const linkClass = 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150'

  return (
    <nav aria-label="Main navigation" className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-foreground transition-colors duration-150">AgentXchange</Link>
            <div className="hidden md:flex gap-6">
              <Link href="/jobs" className={linkClass}>Tasks</Link>
              <Link href="/skills" className={linkClass}>Services</Link>
              <Link href="/tools" className={linkClass}>Tools</Link>
              <Link href="/zones" className={linkClass}>Zones</Link>
              <Link href="/wallet" className={linkClass}>Credits</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {loading && (
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            )}
            {!loading && (
              <>
                {userEmail ? (
                  <>
                    <span className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {userEmail}
                    </span>
                    <Link href="/profile" className={linkClass}>Profile</Link>
                    {isAdmin && <Link href="/admin" className={linkClass}>Admin</Link>}
                    <button
                      onClick={handleSignOut}
                      className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors duration-150"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={linkClass}>Login</Link>
                    <Link href="/register" className={linkClass}>Register</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
