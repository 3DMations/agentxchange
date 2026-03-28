'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { useMobileMenu } from '@/hooks/use-mobile-menu'
import { cn } from '@/lib/utils'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()
  const { isOpen, close, toggle } = useMobileMenu()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null)
      setLoading(false)
    })
  }, [])

  // Auto-close mobile menu on route change
  useEffect(() => {
    close()
  }, [pathname, close])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    close()
    router.push('/login')
  }

  const linkClass =
    'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 motion-reduce:transition-none px-3 py-2 rounded-md'

  return (
    <nav aria-label="Top navigation" className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-foreground transition-colors duration-150 motion-reduce:transition-none"
            >
              AgentXchange
            </Link>
          </div>

          {/* Desktop nav — hidden below md */}
          <div className="hidden md:flex items-center gap-3">
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
                    <span
                      className="text-sm text-muted-foreground max-w-[160px] truncate"
                      title={userEmail}
                    >
                      {userEmail}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors duration-150 motion-reduce:transition-none px-3 py-2 rounded-md"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    {pathname !== '/explore' && (
                      <Link href="/explore" className={linkClass}>
                        Explore
                      </Link>
                    )}
                    {pathname !== '/pricing' && (
                      <Link href="/pricing" className={linkClass}>
                        Pricing
                      </Link>
                    )}
                    <Link href="/login" className={linkClass}>
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 motion-reduce:transition-none hover:bg-primary/90"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile controls — visible below md */}
          <div className="flex md:hidden items-center gap-2">
            {!loading && !userEmail && (
              <Link
                href="/register"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors duration-150 motion-reduce:transition-none hover:bg-primary/90 sm:px-4 sm:py-2 sm:text-sm"
              >
                Get Started
              </Link>
            )}
            <button
              type="button"
              onClick={toggle}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-accent transition-colors motion-reduce:transition-none'
              )}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="navbar-mobile-menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div
          id="navbar-mobile-menu"
          className="border-t border-border bg-card md:hidden"
        >
          <div className="space-y-1 px-4 py-4">
            {loading && (
              <div className="flex flex-col gap-3 px-4 py-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            )}

            {!loading && userEmail ? (
              <>
                {/* Authenticated mobile menu */}
                <div className="px-4 py-3 text-sm text-muted-foreground" title={userEmail}>
                  {userEmail}
                </div>
                <div className="border-t border-border my-2" />
                <button
                  onClick={handleSignOut}
                  className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-destructive hover:bg-accent transition-colors motion-reduce:transition-none"
                >
                  Sign Out
                </button>
              </>
            ) : !loading ? (
              <>
                {/* Unauthenticated mobile menu */}
                {pathname !== '/explore' && (
                  <Link
                    href="/explore"
                    onClick={close}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-foreground hover:bg-accent transition-colors motion-reduce:transition-none"
                  >
                    Explore
                  </Link>
                )}
                {pathname !== '/pricing' && (
                  <Link
                    href="/pricing"
                    onClick={close}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-foreground hover:bg-accent transition-colors motion-reduce:transition-none"
                  >
                    Pricing
                  </Link>
                )}

                <div className="border-t border-border my-2" />

                <Link
                  href="/login"
                  onClick={close}
                  className="block rounded-lg px-4 py-3 text-center text-base font-medium text-foreground border border-border hover:bg-accent transition-colors motion-reduce:transition-none"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="block rounded-lg bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors motion-reduce:transition-none"
                >
                  Get Started
                </Link>
              </>
            ) : null}

            {/* Theme toggle — utility, at bottom */}
            <div className="border-t border-border mt-3 pt-3 flex items-center justify-between px-4">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
