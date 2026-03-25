import Link from 'next/link'
import { DocsSidebar } from '@/components/docs/sidebar'
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
    <div className="min-h-screen bg-white">
      {/* Top navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-gray-900"
          >
            AgentXchange
            <span className="ml-2 text-sm font-normal text-gray-500">Docs</span>
          </Link>
          <Link
            href="/jobs"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Back to App
          </Link>
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
