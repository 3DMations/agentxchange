'use client'


import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'

interface AiTool {
  id: string
  name: string
  provider: string
  version: string
  category: string
  description_short: string
  capabilities: string[]
  pricing_model: string
  verification_status: string
}

const STATUS_BADGE_VARIANT: Record<string, string> = {
  approved: 'success',
  pending: 'warning',
  stale: 'danger',
  rejected: 'danger',
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function ToolsPage() {
  const [tools, setTools] = useState<AiTool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQ, setDebouncedQ] = useState('')

  const handleSearchChange = useCallback((value: string) => {
    setQ(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedQ(value)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchTools() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (debouncedQ) params.set('q', debouncedQ)
      if (category) params.set('category', category)
      if (status) params.set('status', status)

      try {
        const res = await fetch(`/api/v1/tools/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Failed to fetch tools (${res.status})`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setTools(json.data?.tools ?? [])
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
    return () => controller.abort()
  }, [debouncedQ, category, status])

  return (
    <>
      <PageHeader
        title="AI Tool Registry"
        description="Browse and register AI tools"
        action={
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {showForm ? 'Cancel' : 'Register Tool'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          {formError && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-sm text-red-800">{formError}</p></div>}
          {formSuccess && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3"><p className="text-sm text-green-800">{formSuccess}</p></div>}
          <form onSubmit={async (e) => {
            e.preventDefault()
            setFormError(null); setFormSuccess(null); setSubmitting(true)
            const fd = new FormData(e.currentTarget)
            try {
              const res = await fetch('/api/v1/tools/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `tool-${Date.now()}` },
                body: JSON.stringify({
                  name: fd.get('name'), provider: fd.get('provider'), version: fd.get('version'),
                  url: fd.get('url'), category: fd.get('tool_category'),
                  description_short: fd.get('description_short'),
                  capabilities: (fd.get('capabilities') as string)?.split(',').map(c => c.trim()).filter(Boolean) || [],
                  input_formats: ['text'], output_formats: ['text'], pricing_model: fd.get('pricing_model'),
                }),
              })
              const json = await res.json()
              if (!res.ok || json.error) throw new Error(json.error?.message || 'Failed to register tool')
              setFormSuccess('Tool registered!'); setShowForm(false); window.location.reload()
            } catch (err: unknown) { setFormError(err instanceof Error ? err.message : 'Failed') }
            finally { setSubmitting(false) }
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. GPT-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input name="provider" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. OpenAI" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input name="version" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. 4.0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input name="url" type="url" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="tool_category" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="llm">LLM</option>
                <option value="code_assistant">Code Assistant</option>
                <option value="image_gen">Image Gen</option>
                <option value="search">Search</option>
                <option value="embedding">Embedding</option>
                <option value="speech">Speech</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing</label>
              <select name="pricing_model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="free">Free</option>
                <option value="per_token">Per Token</option>
                <option value="per_call">Per Call</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <input name="description_short" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Brief description..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Capabilities (comma-separated)</label>
              <input name="capabilities" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. code-gen, analysis, chat" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Registering...' : 'Register Tool'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search tools..."
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          <option value="llm">LLM</option>
          <option value="code_assistant">Code Assistant</option>
          <option value="image_gen">Image Gen</option>
          <option value="search">Search</option>
          <option value="embedding">Embedding</option>
          <option value="speech">Speech</option>
          <option value="custom">Custom</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="stale">Stale</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500 py-12 text-center">Loading tools...</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && tools.length === 0 && (
        <p className="text-sm text-gray-500 py-12 text-center">No tools found</p>
      )}

      {!loading && !error && tools.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{tool.name}</h3>
                  <p className="text-xs text-gray-500">{tool.provider} &middot; v{tool.version}</p>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[tool.verification_status] ?? 'default'}>
                  {tool.verification_status}
                </Badge>
              </div>

              <div className="mb-3">
                <Badge variant="info">{formatCategory(tool.category)}</Badge>
              </div>

              {tool.description_short && (
                <p className="mb-3 text-sm text-gray-600">{tool.description_short}</p>
              )}

              {tool.capabilities && tool.capabilities.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {tool.capabilities.map((cap) => (
                    <Badge key={cap} variant="default">{cap}</Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">Pricing: {tool.pricing_model ?? 'N/A'}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
