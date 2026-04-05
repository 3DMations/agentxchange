/**
 * Shared test utilities for the AgentXchange web app.
 *
 * Provides factory functions for common mock objects to eliminate
 * duplication across test files. Import from '@/test-utils'.
 */
import { vi } from 'vitest'
import type { Agent, AgentRole, SuspensionStatus, TrustTier, ZoneEnum } from '@agentxchange/shared-types'
import type { Job, JobStatus } from '@agentxchange/shared-types'
import type { WalletBalance } from '@agentxchange/shared-types'

// ─── Mock Supabase Client ────────────────────────────────────────────

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>
  rpc: ReturnType<typeof vi.fn>
  auth: {
    getUser: ReturnType<typeof vi.fn>
  }
  storage: {
    from: ReturnType<typeof vi.fn>
  }
}

/**
 * Creates a mock Supabase client with chainable query methods.
 *
 * Usage:
 * ```ts
 * const supabase = createMockSupabaseClient()
 *
 * // Mock an RPC call
 * supabase.rpc.mockResolvedValueOnce({ data: { available: 100 }, error: null })
 *
 * // Mock a query chain: from('table').select('*').eq('id', x).single()
 * const single = vi.fn().mockResolvedValue({ data: row, error: null })
 * const eq = vi.fn().mockReturnValue({ single })
 * const select = vi.fn().mockReturnValue({ eq })
 * supabase.from.mockReturnValue({ select })
 * ```
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  const upload = vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null })
  const download = vi.fn().mockResolvedValue({ data: new Blob(), error: null })
  const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.url/file' } })
  const remove = vi.fn().mockResolvedValue({ data: [], error: null })

  const storageFrom = vi.fn().mockReturnValue({ upload, download, getPublicUrl, remove })

  return {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-uuid-1', email: 'test@example.com' } },
        error: null,
      }),
    },
    storage: {
      from: storageFrom,
    },
  }
}

// ─── Mock NextRequest ────────────────────────────────────────────────

export interface MockRequestOptions {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: unknown
}

/**
 * Creates a mock NextRequest with configurable method, url, headers, and body.
 *
 * Defaults to GET http://localhost:3000/api/v1/test with an x-agent-id header.
 */
export function createMockRequest(options: MockRequestOptions = {}): Request {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/v1/test',
    headers: headerOverrides = {},
    body,
  } = options

  const defaultHeaders: Record<string, string> = {
    'x-agent-id': 'agent-uuid-1',
    'x-agent-role': 'service',
    'content-type': 'application/json',
  }

  const mergedHeaders = { ...defaultHeaders, ...headerOverrides }
  const headerEntries = Object.entries(mergedHeaders)
  const headersObj = new Headers(headerEntries)

  const init: RequestInit = {
    method,
    headers: headersObj,
  }

  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = JSON.stringify(body)
  }

  const request = new Request(url, init)

  // Attach a json() override that returns the body directly for simpler test assertions
  if (body !== undefined) {
    const originalJson = request.json.bind(request)
    request.json = vi.fn().mockResolvedValue(body) as typeof originalJson
  }

  return request
}

// ─── Mock Agent ──────────────────────────────────────────────────────

/**
 * Creates a mock Agent object with sensible defaults.
 * All fields can be overridden.
 */
export function createMockAgent(overrides: Partial<Agent> = {}): Agent {
  const now = new Date().toISOString()
  return {
    id: 'agent-uuid-1',
    handle: 'test-agent',
    email: 'test@example.com',
    role: 'service' as AgentRole,
    verified: true,
    suspension_status: 'active' as SuspensionStatus,
    trust_tier: 'new' as TrustTier,
    reputation_score: 0,
    solve_rate: 0,
    avg_rating: 0,
    job_count: 0,
    dispute_count: 0,
    level: 1,
    zone: 'starter' as ZoneEnum,
    total_xp: 0,
    onboarding_acknowledged_at: null,
    onboarding_prompt_version: 1,
    api_key_hash: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

// ─── Mock Job ────────────────────────────────────────────────────────

/**
 * Creates a mock Job object with sensible defaults.
 * All fields can be overridden.
 */
export function createMockJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString()
  return {
    id: 'job-uuid-1',
    client_agent_id: 'client-uuid-1',
    service_agent_id: null,
    status: 'open' as JobStatus,
    description: 'Test job',
    acceptance_criteria: 'All tests pass',
    point_budget: 100,
    point_quote: null,
    zone_at_creation: 'starter',
    tools_used: [],
    feature_flag_cohort: null,
    created_at: now,
    accepted_at: null,
    submitted_at: null,
    reviewed_at: null,
    helpfulness_score: null,
    solved: null,
    dispute_id: null,
    ...overrides,
  }
}

// ─── Mock Wallet Balance ─────────────────────────────────────────────

/**
 * Creates a mock WalletBalance object with sensible defaults.
 */
export function createMockWalletBalance(overrides: Partial<WalletBalance> = {}): WalletBalance {
  return {
    available: 100,
    escrowed: 0,
    total: 100,
    ...overrides,
  }
}

// ─── Mock Fetch ──────────────────────────────────────────────────────

export interface MockFetchResponse {
  ok?: boolean
  status?: number
  data?: unknown
  error?: string | null
  /** Raw body to return from json() — overrides the { data, error } envelope */
  rawBody?: unknown
}

/**
 * Creates a vi.fn() configured as a global fetch mock.
 *
 * Supports two modes:
 *
 * 1. **Single response** (default): Every fetch call returns the same response.
 *    ```ts
 *    vi.stubGlobal('fetch', createMockFetch({ data: { id: '1' } }))
 *    ```
 *
 * 2. **Sequential responses**: Each fetch call returns the next response in order.
 *    The last response is reused for any additional calls.
 *    ```ts
 *    vi.stubGlobal('fetch', createMockFetch([
 *      { data: balanceData },
 *      { data: ledgerData },
 *    ]))
 *    ```
 *
 * 3. **URL-based routing**: Pass a record of URL substrings to responses.
 *    ```ts
 *    vi.stubGlobal('fetch', createMockFetch({
 *      '/wallet/balance': { data: balanceData },
 *      '/wallet/ledger': { data: ledgerData },
 *    }))
 *    ```
 */
export function createMockFetch(
  responses?: MockFetchResponse | MockFetchResponse[] | Record<string, MockFetchResponse>,
): ReturnType<typeof vi.fn> {
  // Default single success response
  if (responses === undefined) {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: null, error: null }),
    })
  }

  // URL-based routing
  if (!Array.isArray(responses) && typeof responses === 'object' && !('ok' in responses || 'data' in responses || 'status' in responses || 'rawBody' in responses || 'error' in responses)) {
    const routeMap = responses as Record<string, MockFetchResponse>
    return vi.fn((url: string) => {
      for (const [pattern, resp] of Object.entries(routeMap)) {
        if (url.includes(pattern)) {
          return Promise.resolve(buildFetchResponse(resp))
        }
      }
      // Fallback for unmatched URLs
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
    })
  }

  // Sequential responses
  if (Array.isArray(responses)) {
    let callIndex = 0
    return vi.fn(() => {
      const resp = responses[Math.min(callIndex, responses.length - 1)]!
      callIndex++
      return Promise.resolve(buildFetchResponse(resp))
    })
  }

  // Single response
  const single = responses as MockFetchResponse
  return vi.fn().mockResolvedValue(buildFetchResponse(single))
}

function buildFetchResponse(resp: MockFetchResponse) {
  const ok = resp.ok ?? true
  const status = resp.status ?? (ok ? 200 : 500)
  const body = resp.rawBody ?? { data: resp.data ?? null, error: resp.error ?? null }

  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  }
}
