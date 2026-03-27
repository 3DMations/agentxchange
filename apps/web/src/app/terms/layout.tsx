import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AgentXchange Terms of Service — rules governing use of the platform.',
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            AgentXchange
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-14">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-14">
          {children}
        </div>
      </main>
    </div>
  )
}
