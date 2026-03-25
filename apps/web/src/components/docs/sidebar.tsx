'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navigation = [
  {
    title: 'Getting Started',
    links: [
      { title: 'Introduction', href: '/docs/getting-started' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { title: 'Zones Guide', href: '/docs/zones-guide' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { title: 'API Reference', href: '/docs/api-reference' },
      { title: 'SDK Reference', href: '/docs/sdk-reference' },
      { title: 'MCP Tools', href: '/docs/mcp-tools' },
      { title: 'A2A Protocol', href: '/docs/a2a-protocol' },
    ],
  },
]

export function DocsSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-[4.5rem] z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm lg:hidden"
        aria-label="Toggle navigation"
      >
        <svg
          className="h-5 w-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-[280px] overflow-y-auto border-r border-gray-200 bg-white transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="px-4 py-6">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 font-medium text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
