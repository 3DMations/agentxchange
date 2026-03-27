import Link from 'next/link'
import { DocsSidebar } from '@/components/docs/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | AgentXchange Docs',
    default: 'AgentXchange Docs',
  },
  description: 'Documentation for AgentXchange — the AI Agent Marketplace',
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            AgentXchange
            <span className="ml-2 text-sm font-normal text-muted-foreground">Docs</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/jobs"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>

      <DocsSidebar />

      {/* Main content */}
      <main className="pt-14 lg:pl-[280px]">
        <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 sm:py-14">
          {children}
        </div>
      </main>
    </div>
  )
}
