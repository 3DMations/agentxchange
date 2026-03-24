// REST API client for calling the Next.js API from the MCP server

const API_BASE = process.env.AGENTXCHANGE_API_URL || 'http://localhost:3000/api/v1'

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1000
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

export interface ApiClientOptions {
  maxRetries?: number
  retryDelayMs?: number
}

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
  meta: { cursor_next?: string; total?: number }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class ApiClient {
  private maxRetries: number
  private retryDelayMs: number

  constructor(private apiKey: string, options?: ApiClientOptions) {
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES
    this.retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    }

    if (method !== 'GET' && body) {
      headers['Idempotency-Key'] = `mcp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          method,
          headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
        })

        // Don't retry client errors (except retryable ones)
        if (!res.ok && !RETRYABLE_STATUS_CODES.has(res.status)) {
          return res.json() as Promise<ApiResponse<T>>
        }

        // Retry on retryable status codes
        if (!res.ok && RETRYABLE_STATUS_CODES.has(res.status) && attempt < this.maxRetries) {
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`)
          await sleep(this.retryDelayMs * Math.pow(2, attempt))
          continue
        }

        return res.json() as Promise<ApiResponse<T>>
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < this.maxRetries) {
          await sleep(this.retryDelayMs * Math.pow(2, attempt))
          continue
        }
      }
    }

    // All retries exhausted
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: lastError?.message ?? 'Request failed after retries',
      },
      meta: {},
    }
  }

  // Agent endpoints
  async searchAgents(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString()
    return this.request('GET', `/agents/search?${qs}`)
  }

  async getProfile(agentId?: string) {
    if (!agentId) {
      return {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Agent ID is required' },
        meta: {},
      }
    }
    return this.request('GET', `/agents/${agentId}/profile`)
  }

  // Job endpoints
  async postRequest(data: { description: string; acceptance_criteria: string; point_budget: number; required_skills?: string[]; tools_required?: string[] }) {
    return this.request('POST', '/requests', data)
  }

  async submitDeliverable(jobId: string, data: { deliverable_id: string; notes?: string }) {
    return this.request('POST', `/requests/${jobId}/submit`, data)
  }

  async rateAgent(jobId: string, data: { helpfulness_score: number; solved: boolean; feedback?: string }) {
    return this.request('POST', `/requests/${jobId}/rate`, data)
  }

  // Wallet
  async checkWallet() {
    return this.request('GET', '/wallet/balance')
  }

  // Skills
  async listSkills(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request('GET', `/skills/catalog${qs}`)
  }

  // Zones
  async getZoneInfo(zoneName?: string) {
    const path = zoneName ? `/zones/${zoneName}` : '/zones'
    return this.request('GET', path)
  }

  // Tools
  async registerTool(data: Record<string, unknown>) {
    return this.request('POST', '/tools/register', data)
  }

  async getToolProfile(toolId: string) {
    return this.request('GET', `/tools/${toolId}`)
  }

  async searchTools(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.request('GET', `/tools/search${qs}`)
  }
}
