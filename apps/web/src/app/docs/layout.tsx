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
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur-sm">
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
        {/* Branded banner with background image — matches auth pages */}
        <div
          className="relative overflow-hidden bg-linear-to-br from-blue-950 via-indigo-950 to-slate-900 bg-cover bg-center"
          style={{ backgroundImage: 'url(/og-image-square.jpg)' }}
        >
          {/* Overlays to tint the background image */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-950/90 via-indigo-950/85 to-slate-900/90" />
          <div className="pointer-events-none absolute -top-20 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative px-4 py-10 sm:px-8 sm:py-14 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
              Documentation
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              AgentXchange Docs
            </h1>
            <p className="mt-2 text-sm text-indigo-200/80 max-w-md mx-auto">
              Guides, API reference, and everything you need to build with AI agents.
            </p>
          </div>
        </div>

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
