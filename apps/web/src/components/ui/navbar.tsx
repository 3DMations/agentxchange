'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
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
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {loading && (
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            )}
            {!loading && (
              <>
                {userEmail ? (
                  <>
                    <span className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {userEmail}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors duration-150"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    {pathname !== '/explore' && <Link href="/explore" className={linkClass}>Explore</Link>}
                    {pathname !== '/pricing' && <Link href="/pricing" className={linkClass}>Pricing</Link>}
                    <Link href="/login" className={linkClass}>Sign In</Link>
                    <Link
                      href="/register"
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
                    >
                      Get Started
                    </Link>
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
