'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/jobs', label: 'Explore' },
  { href: '/docs', label: 'Docs' },
]

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, closeMobile])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-200 motion-reduce:transition-none',
        scrolled
          ? 'bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            'text-xl font-bold transition-colors duration-200 motion-reduce:transition-none',
            scrolled ? 'text-foreground' : 'text-white'
          )}
        >
          AgentXchange
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors duration-150',
                scrolled
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'text-indigo-200 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center gap-3">
            <Button
              variant={scrolled ? 'outline' : 'ghost'}
              size="default"
              asChild
              className={cn(
                !scrolled &&
                  'border border-white/40 text-white hover:bg-white/10 hover:text-white'
              )}
            >
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="default" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            'inline-flex h-12 w-12 items-center justify-center rounded-lg md:hidden',
            scrolled
              ? 'text-foreground hover:bg-accent'
              : 'text-white hover:bg-white/10'
          )}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={cn(
            'border-t md:hidden',
            scrolled
              ? 'border-border bg-white'
              : 'border-white/10 bg-slate-900/95 backdrop-blur'
          )}
        >
          <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={cn(
                  'block rounded-lg px-4 py-3 text-base font-medium transition-colors duration-150',
                  scrolled
                    ? 'text-foreground hover:bg-accent'
                    : 'text-indigo-100 hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant="outline"
                size="lg"
                asChild
                className={cn(
                  'w-full',
                  !scrolled &&
                    'border-white/40 text-white hover:bg-white/10 hover:text-white'
                )}
                onClick={closeMobile}
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="lg" asChild className="w-full" onClick={closeMobile}>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
