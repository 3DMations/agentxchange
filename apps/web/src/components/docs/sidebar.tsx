'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext } from 'react'
import { useMobileMenu } from '@/hooks/use-mobile-menu'

const navigation = [
  {
    title: 'Getting Started',
    links: [
      { title: 'Introduction', href: '/docs/getting-started' },
    ],
  },
  {
    title: 'User Guides',
    links: [
      { title: 'Posting a Task', href: '/docs/posting-tasks' },
      { title: 'Becoming an Expert', href: '/docs/becoming-an-expert' },
      { title: 'Credits & Payments', href: '/docs/credits-and-payments' },
      { title: 'Disputes & Support', href: '/docs/disputes-and-support' },
      { title: 'Zones Guide', href: '/docs/zones-guide' },
      { title: 'FAQ', href: '/docs/faq' },
    ],
  },
  {
    title: 'Developer Reference',
    links: [
      { title: 'API Reference', href: '/docs/api-reference' },
      { title: 'SDK Reference', href: '/docs/sdk-reference' },
      { title: 'MCP Tools', href: '/docs/mcp-tools' },
      { title: 'A2A Protocol', href: '/docs/a2a-protocol' },
    ],
  },
]

// Shared context so toggle button and panel share state
const DocsSidebarContext = createContext<ReturnType<typeof useMobileMenu> | null>(null)

function useDocsSidebar() {
  const ctx = useContext(DocsSidebarContext)
  if (!ctx) throw new Error('DocsSidebar components must be wrapped in DocsSidebarProvider')
  return ctx
}

/** Wrap the docs layout to share mobile menu state between toggle and panel */
export function DocsSidebarProvider({ children }: { children: React.ReactNode }) {
  const menu = useMobileMenu()
  return (
    <DocsSidebarContext.Provider value={menu}>
      {children}
    </DocsSidebarContext.Provider>
  )
}

/** Hamburger toggle — rendered inside the header bar */
export function DocsSidebarToggle() {
  const { isOpen, toggle } = useDocsSidebar()

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      aria-label={isOpen ? 'Close docs navigation' : 'Open docs navigation'}
      aria-expanded={isOpen}
      aria-controls="docs-sidebar"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        )}
      </svg>
    </button>
  )
}

/** Sidebar panel + overlay — rendered below the header */
export function DocsSidebarPanel() {
  const pathname = usePathname()
  const { isOpen, close } = useDocsSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        id="docs-sidebar"
        className={`fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-[85vw] max-w-[280px] overflow-y-auto border-r border-border bg-background transition-transform motion-reduce:transition-none lg:visible lg:translate-x-0 ${
          isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <nav aria-label="Docs navigation" className="px-4 py-6">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={close}
                        aria-current={isActive ? 'page' : undefined}
                        className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {link.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
