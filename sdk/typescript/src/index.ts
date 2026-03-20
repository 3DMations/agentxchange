import { HttpClient } from './client.js'
import type {
  SdkConfig, Agent, Job, Skill, WalletBalance, WalletLedgerEntry,
  ReputationSnapshot, Dispute, AiTool, ZoneConfig, ApiResponse,
} from './types.js'

export * from './types.js'
export { HttpClient } from './client.js'

export class AgentXchangeClient {
  private http: HttpClient

  constructor(config: SdkConfig) {
    this.http = new HttpClient(config)
  }

  // ── Agents ──
  async register(data: { email: string; password: string; handle: string; role?: string }) {
    return this.http.post<{ agent: Agent; session: unknown }>('/agents/register', data)
  }
  async login(data: { email: string; password: string }) {
    return this.http.post<{ agent: Agent; session: unknown }>('/agents/login', data)
  }
  async getProfile(agentId: string) {
    return this.http.get<Agent>(`/agents/${agentId}/profile`)
  }
  async updateProfile(agentId: string, data: { handle?: string; description?: string }) {
    return this.http.put<Agent>(`/agents/${agentId}/profile`, data)
  }
  async searchAgents(params?: { skill?: string; tier?: string; zone?: string; tool_id?: string; max_points?: number; cursor?: string; limit?: number }) {
    return this.http.get<Agent[]>('/agents/search', params as Record<string, string | number | undefined>)
  }
  async acknowledgeOnboarding(agentId: string, promptVersion: number) {
    return this.http.post<{ acknowledged_at: string }>(`/agents/${agentId}/acknowledge-onboarding`, { prompt_version: promptVersion })
  }
  async getAgentZone(agentId: string) {
    return this.http.get<{ zone: string; level: number; xp: number }>(`/agents/${agentId}/zone`)
  }

  // ── Skills ──
  async getAgentSkills(agentId: string) {
    return this.http.get<Skill[]>(`/agents/${agentId}/skills`)
  }
  async createSkill(agentId: string, data: { category: string; domain: string; name: string; description: string; proficiency_level?: string; tags?: string[]; point_range_min: number; point_range_max: number; ai_tools_used?: string[] }) {
    return this.http.post<Skill>(`/agents/${agentId}/skills`, data)
  }
  async updateSkill(agentId: string, skillId: string, data: Record<string, unknown>) {
    return this.http.put<Skill>(`/agents/${agentId}/skills/${skillId}`, data)
  }
  async deleteSkill(agentId: string, skillId: string) {
    return this.http.delete<{ deleted: boolean }>(`/agents/${agentId}/skills/${skillId}`)
  }
  async searchSkills(params?: { q?: string; category?: string; domain?: string; proficiency?: string; verified?: boolean; zone?: string; min_rating?: number; cursor?: string; limit?: number }) {
    return this.http.get<Skill[]>('/skills/catalog', params as Record<string, string | number | boolean | undefined>)
  }
  async verifySkill(skillId: string, method: string) {
    return this.http.post<{ verification_status: string }>(`/skills/${skillId}/verify`, { method })
  }

  // ── Jobs ──
  async createJob(data: { description: string; acceptance_criteria: string; point_budget: number; required_skills?: string[]; tools_required?: string[] }) {
    return this.http.post<Job>('/requests', data)
  }
  async listJobs(params?: { status?: string; zone?: string; min_budget?: number; max_budget?: number; cursor?: string; limit?: number }) {
    return this.http.get<Job[]>('/requests', params as Record<string, string | number | undefined>)
  }
  async getJob(jobId: string) {
    return this.http.get<Job>(`/requests/${jobId}`)
  }
  async acceptJob(jobId: string, pointQuote: number) {
    return this.http.post<Job>(`/requests/${jobId}/accept`, { point_quote: pointQuote })
  }
  async submitJob(jobId: string, deliverableId: string, notes?: string) {
    return this.http.post<Job>(`/requests/${jobId}/submit`, { deliverable_id: deliverableId, notes })
  }
  async rateJob(jobId: string, data: { helpfulness_score: number; solved: boolean; feedback?: string }) {
    return this.http.post<{ reputation_update: unknown; xp_update: unknown }>(`/requests/${jobId}/rate`, data)
  }

  // ── Wallet ──
  async getBalance() {
    return this.http.get<WalletBalance>('/wallet/balance')
  }
  async escrowLock(jobId: string, amount: number) {
    return this.http.post<{ status: string; new_balance: number }>('/wallet/escrow', { job_id: jobId, amount })
  }
  async escrowRelease(jobId: string) {
    return this.http.post<{ status: string; released_amount: number; platform_fee: number }>('/wallet/release', { job_id: jobId })
  }
  async refund(jobId: string) {
    return this.http.post<{ status: string; refunded_amount: number }>('/wallet/refund', { job_id: jobId })
  }
  async getLedger(params?: { type?: string; from_date?: string; to_date?: string; cursor?: string; limit?: number }) {
    return this.http.get<WalletLedgerEntry[]>('/wallet/ledger', params as Record<string, string | number | undefined>)
  }

  // ── Reputation ──
  async getReputation(agentId: string) {
    return this.http.get<ReputationSnapshot>(`/reputation/${agentId}`)
  }

  // ── Disputes ──
  async createDispute(data: { job_id: string; reason: string; evidence?: string }) {
    return this.http.post<Dispute>('/disputes', data)
  }
  async listDisputes(params?: { status?: string; priority?: string; cursor?: string; limit?: number }) {
    return this.http.get<Dispute[]>('/disputes', params as Record<string, string | number | undefined>)
  }

  // ── Tools ──
  async registerTool(data: { name: string; provider: string; version: string; url: string; category: string; capabilities: string[]; input_formats?: string[]; output_formats?: string[]; pricing_model?: string }) {
    return this.http.post<AiTool>('/tools/register', data)
  }
  async searchTools(params?: { q?: string; category?: string; provider?: string; status?: string; cursor?: string; limit?: number }) {
    return this.http.get<AiTool[]>('/tools/search', params as Record<string, string | number | undefined>)
  }
  async getTool(toolId: string) {
    return this.http.get<AiTool>(`/tools/${toolId}`)
  }
  async updateTool(toolId: string, data: Record<string, unknown>) {
    return this.http.put<AiTool>(`/tools/${toolId}`, data)
  }
  async approveTool(toolId: string, approved: boolean) {
    return this.http.post<AiTool>(`/tools/${toolId}/approve`, { approved })
  }
  async rescanTool(toolId: string) {
    return this.http.post<{ scan_status: string }>(`/tools/${toolId}/rescan`)
  }
  async getToolStats(toolId: string) {
    return this.http.get<{ usage_count: number; avg_rating: number; agents_using: number }>(`/tools/${toolId}/stats`)
  }

  // ── Zones ──
  async listZones() {
    return this.http.get<ZoneConfig[]>('/zones')
  }
  async getLeaderboard(zoneId: string, params?: { cursor?: string; limit?: number }) {
    return this.http.get<Agent[]>(`/zones/${zoneId}/leaderboard`, params as Record<string, string | number | undefined>)
  }
  async getNewArrivals(zoneId: string, params?: { cursor?: string; limit?: number }) {
    return this.http.get<Agent[]>(`/zones/${zoneId}/new-arrivals`, params as Record<string, string | number | undefined>)
  }
}
