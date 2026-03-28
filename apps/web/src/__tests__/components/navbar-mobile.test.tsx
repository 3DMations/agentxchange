// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navbar } from '@/components/ui/navbar'

// ---- Mocks ----

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// Track mobile menu state so we can verify toggle behavior
const mobileMenuState = { isOpen: false }
const mockClose = vi.fn(() => {
  mobileMenuState.isOpen = false
})
const mockToggle = vi.fn(() => {
  mobileMenuState.isOpen = !mobileMenuState.isOpen
})

vi.mock('@/hooks/use-mobile-menu', () => ({
  useMobileMenu: () => ({
    isOpen: mobileMenuState.isOpen,
    open: vi.fn(() => {
      mobileMenuState.isOpen = true
    }),
    close: mockClose,
    toggle: mockToggle,
  }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: () => ({
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      signOut: vi.fn(),
    },
  }),
}))

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  Menu: (props: any) => <svg data-testid="menu-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
}))

// ---- Tests ----

describe('Navbar mobile states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mobileMenuState.isOpen = false
  })

  it('renders logo and hamburger button on initial load', async () => {
    render(<Navbar />)

    // Wait for auth loading to finish
    await screen.findByLabelText('Open menu')

    // Logo
    expect(screen.getByText('AgentXchange')).toBeTruthy()

    // Hamburger button with correct aria-label
    const hamburger = screen.getByLabelText('Open menu')
    expect(hamburger).toBeTruthy()
    expect(hamburger.getAttribute('aria-expanded')).toBe('false')
  })

  it('hamburger toggle opens/closes mobile menu', async () => {
    const { rerender } = render(<Navbar />)

    // Wait for loading to complete
    await screen.findByLabelText('Open menu')

    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)
    expect(mockToggle).toHaveBeenCalledTimes(1)

    // Simulate the state change from toggle
    // mobileMenuState.isOpen is now true due to mockToggle
    rerender(<Navbar />)

    // Menu should now be open — aria-label changes to "Close menu"
    const closeButton = screen.getByLabelText('Close menu')
    expect(closeButton).toBeTruthy()
    expect(closeButton.getAttribute('aria-expanded')).toBe('true')

    // The mobile menu dropdown should be visible (Explore appears in both desktop and mobile nav)
    expect(screen.getAllByText('Explore').length).toBeGreaterThanOrEqual(2)

    // Click again to close
    fireEvent.click(closeButton)
    expect(mockToggle).toHaveBeenCalledTimes(2)

    // mobileMenuState.isOpen is now false
    rerender(<Navbar />)
    expect(screen.getByLabelText('Open menu')).toBeTruthy()
  })

  it('unauthenticated mobile menu shows Explore, Pricing, Sign In, Get Started links', async () => {
    // Open the menu
    mobileMenuState.isOpen = true
    render(<Navbar />)

    // Wait for auth to resolve (unauthenticated)
    await screen.findByText('Explore')

    // All four navigation links should be present in the mobile menu
    const exploreLink = screen.getByRole('link', { name: 'Explore' })
    expect(exploreLink.getAttribute('href')).toBe('/explore')

    const pricingLink = screen.getByRole('link', { name: 'Pricing' })
    expect(pricingLink.getAttribute('href')).toBe('/pricing')

    const signInLink = screen.getByRole('link', { name: 'Sign In' })
    expect(signInLink.getAttribute('href')).toBe('/login')

    // Get Started appears in both the mobile controls area and the dropdown menu
    const getStartedLinks = screen.getAllByRole('link', { name: 'Get Started' })
    const menuGetStarted = getStartedLinks.find(
      (el) => el.getAttribute('href') === '/register'
    )
    expect(menuGetStarted).toBeTruthy()
  })

  it('renders "Get Started" CTA outside hamburger menu (visible in mobile controls)', async () => {
    // Menu is closed — the CTA should still be visible in the mobile controls bar
    mobileMenuState.isOpen = false
    render(<Navbar />)

    // Wait for auth loading to finish
    await screen.findByLabelText('Open menu')

    // There should be a Get Started link visible even when menu is closed
    const getStartedLinks = screen.getAllByRole('link', { name: 'Get Started' })
    expect(getStartedLinks.length).toBeGreaterThanOrEqual(1)

    // Verify at least one points to /register
    const registerLink = getStartedLinks.find(
      (el) => el.getAttribute('href') === '/register'
    )
    expect(registerLink).toBeTruthy()
  })
})
