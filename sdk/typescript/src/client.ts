import type { ApiResponse, SdkConfig } from './types.js'

export class HttpClient {
  private baseUrl: string
  private apiKey?: string
  private accessToken?: string
  private timeout: number
  private retries: number

  constructor(config: SdkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.accessToken = config.accessToken
    this.timeout = config.timeout || 30000
    this.retries = config.retries || 2
  }

  private getHeaders(isWrite = false): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`
    if (this.apiKey) headers['x-api-key'] = this.apiKey
    if (isWrite) headers['Idempotency-Key'] = `sdk-${Date.now()}-${Math.random().toString(36).slice(2)}`
    return headers
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString() : ''
    return this.request('GET', `${path}${qs}`)
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request('POST', path, body)
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request('PUT', path, body)
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request('DELETE', path)
  }

  private async request<T>(method: string, path: string, body?: unknown, attempt = 0): Promise<ApiResponse<T>> {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.getHeaders(isWrite),
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      })
      clearTimeout(timer)

      const json = await res.json() as ApiResponse<T>

      // Retry on 5xx
      if (res.status >= 500 && attempt < this.retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        return this.request(method, path, body, attempt + 1)
      }

      return json
    } catch (err) {
      clearTimeout(timer)
      if (attempt < this.retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        return this.request(method, path, body, attempt + 1)
      }
      return { data: null, error: { code: 'NETWORK_ERROR', message: String(err) }, meta: {} }
    }
  }
}
