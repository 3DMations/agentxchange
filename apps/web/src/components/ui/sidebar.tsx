'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  Home,
  Compass,
  Briefcase,
  Star,
  Wrench,
  LayoutGrid,
  Wallet,
  User,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'agentxchange-sidebar-collapsed'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number | string | null
}

const mainItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
]

const marketplaceItems: NavItem[] = [
  { label: 'Skills', href: '/skills', icon: Star },
  { label: 'Tools', href: '/tools', icon: Wrench },
  { label: 'Zones', href: '/zones', icon: LayoutGrid },
]

const accountItems: NavItem[] = [
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  jobCount?: number | null
  walletBalance?: string | null
}

export function Sidebar({ jobCount, walletBalance }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tabletOverlayOpen, setTabletOverlayOpen] = useState(false)

  // Read persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setCollapsed(stored === 'true')
    }
    setMounted(true)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  // Tablet overlay: clicking a link closes the overlay
  const handleNavClick = useCallback(() => {
    setTabletOverlayOpen(false)
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const isAdmin = pathname.startsWith('/admin')

  const renderItem = (item: NavItem) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const badge =
      item.label === 'Jobs' && jobCount != null
        ? jobCount
        : item.label === 'Wallet' && walletBalance != null
          ? walletBalance
          : null

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
          'motion-reduce:transition-none',
          active
            ? 'bg-accent text-accent-foreground before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-primary'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          collapsed && !tabletOverlayOpen && 'justify-center px-0'
        )}
        title={collapsed && !tabletOverlayOpen ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {(!collapsed || tabletOverlayOpen) && (
          <>
            <span className="truncate">{item.label}</span>
            {badge != null && (
              <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  const renderSection = (label: string, items: NavItem[]) => (
    <div className="space-y-1">
      {(!collapsed || tabletOverlayOpen) && (
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
      )}
      {items.map(renderItem)}
    </div>
  )

  // Sidebar content shared between desktop and tablet overlay
  const sidebarContent = (
    <>
      {/* New Task CTA */}
      <div className="px-3 pb-2">
        <Button
          asChild
          className={cn(
            'w-full transition-all duration-200 motion-reduce:transition-none',
            collapsed && !tabletOverlayOpen && 'px-0'
          )}
          size={collapsed && !tabletOverlayOpen ? 'icon' : 'default'}
        >
          <Link href="/new-task" onClick={handleNavClick}>
            <Plus className="h-4 w-4 shrink-0" />
            {(!collapsed || tabletOverlayOpen) && (
              <span className="ml-2">New Task</span>
            )}
          </Link>
        </Button>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-2">
        {renderSection('Main', mainItems)}
        <div className="mx-3 border-t border-border" />
        {renderSection('Marketplace', marketplaceItems)}
        <div className="mx-3 border-t border-border" />
        {renderSection('Account', accountItems)}
      </nav>

      {/* Bottom area */}
      <div className="space-y-2 border-t border-border px-2 pt-3">
        {isAdmin && (
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 motion-reduce:transition-none',
              collapsed && !tabletOverlayOpen && 'justify-center px-0'
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {(!collapsed || tabletOverlayOpen) && (
              <span>Back to Dashboard</span>
            )}
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors duration-200 motion-reduce:transition-none',
            collapsed && !tabletOverlayOpen && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed && !tabletOverlayOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  )

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className="hidden lg:flex h-full w-64 flex-col border-r border-border bg-card" />
    )
  }

  return (
    <>
      {/* Desktop sidebar (lg+) */}
      <aside
        className={cn(
          'hidden lg:flex h-full flex-col border-r border-border bg-card py-4 transition-[width] duration-200 motion-reduce:transition-none',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Tablet sidebar (md to lg): collapsed rail + overlay */}
      <aside className="hidden md:flex lg:hidden h-full w-16 flex-col border-r border-border bg-card py-4">
        {/* Collapsed rail: show icons only, click opens overlay */}
        <div className="px-3 pb-2">
          <Button
            size="icon"
            className="w-full"
            onClick={() => setTabletOverlayOpen(true)}
            aria-label="Open navigation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {[...mainItems, ...marketplaceItems, ...accountItems].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center justify-center rounded-md px-0 py-2 transition-colors duration-200 motion-reduce:transition-none',
                  active
                    ? 'bg-accent text-accent-foreground before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-primary'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Tablet overlay */}
      {tabletOverlayOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:block lg:hidden"
            onClick={() => setTabletOverlayOpen(false)}
            aria-hidden="true"
          />
          {/* Expanded sidebar overlay */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card py-4 shadow-lg md:block lg:hidden animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
