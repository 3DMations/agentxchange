// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import type { Mock } from 'vitest'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))


vi.mock('@/lib/utils/auth-fetch', () => ({ authFetch: vi.fn((...args: Parameters<typeof fetch>) => fetch(...args)) }))

import ToolsPage from './page'

const mockTool = {
  id: 'tool-1',
  name: 'CodeBot',
  provider: 'Acme AI',
  version: '2.1.0',
  category: 'code_assistant',
  description_short: 'An AI-powered code helper',
  capabilities: ['code-gen', 'refactor'],
  pricing_model: 'per_request',
  verification_status: 'approved',
}

function createFetchResponse(data: any, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  })
}

describe('ToolsPage', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('shows loading state initially', () => {
    fetchMock.mockReturnValue(new Promise(() => {})) // never resolves
    render(<ToolsPage />)
    expect(screen.getByText('Loading tools...')).toBeTruthy()
  })

  it('renders tools after successful fetch', async () => {
    fetchMock.mockReturnValue(
      createFetchResponse({ data: [mockTool], error: null })
    )

    render(<ToolsPage />)

    await waitFor(() => {
      expect(screen.getByText('CodeBot')).toBeTruthy()
    })

    expect(screen.getByText('An AI-powered code helper')).toBeTruthy()
    expect(screen.getByText(/Acme AI/)).toBeTruthy()
    expect(screen.getByText(/v2\.1\.0/)).toBeTruthy()
    expect(screen.getAllByText('Code Assistant').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('approved').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('code-gen')).toBeTruthy()
    expect(screen.getByText('refactor')).toBeTruthy()
    expect(screen.getByText('Pricing: per_request')).toBeTruthy()
  })

  it('shows error on fetch failure', async () => {
    fetchMock.mockReturnValue(
      createFetchResponse({}, false, 500)
    )

    render(<ToolsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch tools (500)')).toBeTruthy()
    })
  })

  it('shows "No tools found" when empty', async () => {
    fetchMock.mockReturnValue(
      createFetchResponse({ data: [], error: null })
    )

    render(<ToolsPage />)

    await waitFor(() => {
      expect(screen.getByText('No tools found')).toBeTruthy()
    })
  })

  it('category filter changes trigger re-fetch', async () => {
    fetchMock.mockReturnValue(
      createFetchResponse({ data: [mockTool], error: null })
    )

    render(<ToolsPage />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    // Change category filter
    const categorySelect = screen.getByDisplayValue('All Categories')
    fireEvent.change(categorySelect, { target: { value: 'llm' } })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    // Verify the second call included the category param
    const secondCallUrl = fetchMock.mock.calls[1]![0] as string
    expect(secondCallUrl).toContain('category=llm')
  })
})
