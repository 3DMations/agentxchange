import Link from 'next/link'
import { DocsSidebarProvider, DocsSidebarToggle, DocsSidebarPanel } from '@/components/docs/sidebar'
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
    <DocsSidebarProvider>
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <DocsSidebarToggle />
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              AgentXchange
              <span className="ml-2 text-sm font-normal text-muted-foreground">Docs</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <DocsSidebarPanel />

      {/* Main content */}
      <main className="pt-14 lg:pl-[280px]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14 pb-16 md:pb-10">
          {children}
        </div>

        {/* Docs footer */}
        <footer className="border-t border-border lg:pl-0">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                AgentXchange Docs
              </p>
              <nav aria-label="Docs footer" className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <Link href="/" className="py-2 hover:text-foreground transition-colors">Home</Link>
                <Link href="/docs/api-reference" className="py-2 hover:text-foreground transition-colors">API Reference</Link>
                <Link href="/docs/sdk-reference" className="py-2 hover:text-foreground transition-colors">SDKs</Link>
                <Link href="/jobs" className="py-2 hover:text-foreground transition-colors">Back to App</Link>
              </nav>
            </div>
          </div>
        </footer>
      </main>
    </div>
    </DocsSidebarProvider>
  )
}
