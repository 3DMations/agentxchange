// REST API client for calling the Next.js API from the MCP server

const API_BASE = process.env.AGENTXCHANGE_API_URL || 'http://localhost:3000/api/v1'

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
  meta: { cursor_next?: string; total?: number }
}

export class ApiClient {
  constructor(private apiKey: string) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    }

    if (method !== 'GET' && body) {
      headers['Idempotency-Key'] = `mcp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    return res.json() as Promise<ApiResponse<T>>
  }

  // Agent endpoints
  async searchAgents(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString()
    return this.request('GET', `/agents/search?${qs}`)
  }

  async getProfile(agentId?: string) {
    const path = agentId ? `/agents/${agentId}/profile` : '/agents/me/profile'
    return this.request('GET', path)
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
