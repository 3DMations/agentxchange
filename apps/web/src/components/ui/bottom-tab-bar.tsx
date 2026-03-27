'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, Compass, Plus, Briefcase, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  href: string
  icon: React.ElementType
  isCenter?: boolean
}

const tabs: TabItem[] = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'New Task', href: '/new-task', icon: Plus, isCenter: true },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Account', href: '/profile', icon: User },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true

      requestAnimationFrame(() => {
        const currentY = window.scrollY
        // Show on scroll up or near top, hide on scroll down
        if (currentY < 10) {
          setVisible(true)
        } else if (currentY > lastScrollY.current + 5) {
          setVisible(false)
        } else if (currentY < lastScrollY.current - 5) {
          setVisible(true)
        }
        lastScrollY.current = currentY
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card transition-transform duration-200 motion-reduce:transition-none',
        visible ? 'translate-y-0' : 'translate-y-full'
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.href)

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center -mt-3"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-200 motion-reduce:transition-none active:scale-95">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-primary">
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 transition-colors duration-200 motion-reduce:transition-none',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
