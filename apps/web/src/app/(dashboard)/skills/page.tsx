'use client'


import { useCallback, useEffect, useRef, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Skill {
  id: string
  name: string
  category: string
  domain: string
  description: string
  proficiency_level: string
  verified: boolean
  tags: string[]
  point_range_min: number
  point_range_max: number
  avg_rating_for_skill: number
  jobs_completed_for_skill: number
}

const CATEGORY_VARIANTS: Record<string, string> = {
  code_generation: 'info',
  data_analysis: 'success',
  content_creation: 'warning',
  research: 'default',
  translation: 'info',
  devops: 'danger',
  security_audit: 'danger',
  design: 'warning',
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function truncate(text: string, maxLen = 100): string {
  if (!text || text.length <= maxLen) return text ?? ''
  return text.slice(0, maxLen) + '...'
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [proficiency, setProficiency] = useState('')
  const [verified, setVerified] = useState(false)

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

    async function fetchSkills() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (debouncedQ) params.set('q', debouncedQ)
      if (category) params.set('category', category)
      if (proficiency) params.set('proficiency', proficiency)
      if (verified) params.set('verified', 'true')

      try {
        const res = await fetch(`/api/v1/skills/catalog?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Failed to fetch skills (${res.status})`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setSkills(json.data ?? [])
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
    return () => controller.abort()
  }, [debouncedQ, category, proficiency, verified, refreshKey])

  return (
    <>
      <PageHeader
        title="Skill Catalog"
        description="Browse, search, and manage skills"
        action={
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {showForm ? 'Cancel' : 'Add Skill'}
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
              const supabase = createSupabaseClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) { setFormError('Sign in to add skills'); return }
              const res = await fetch(`/api/v1/agents/${user.id}/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `skill-${Date.now()}` },
                body: JSON.stringify({
                  name: fd.get('name'), category: fd.get('category'), domain: fd.get('domain'),
                  description: fd.get('description'), proficiency_level: fd.get('proficiency_level'),
                  point_range_min: Number(fd.get('point_range_min')), point_range_max: Number(fd.get('point_range_max')),
                  tags: (fd.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
                  ai_tools_used: (fd.get('ai_tools_used') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
                }),
              })
              const json = await res.json()
              if (!res.ok || json.error) throw new Error(json.error?.message || 'Failed to add skill')
              setFormSuccess('Skill added!'); setShowForm(false); setRefreshKey(k => k + 1)
            } catch (err: unknown) { setFormError(err instanceof Error ? err.message : 'Failed') }
            finally { setSubmitting(false) }
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. React Development" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="code_generation">Code Generation</option>
                <option value="data_analysis">Data Analysis</option>
                <option value="content_creation">Content Creation</option>
                <option value="research">Research</option>
                <option value="translation">Translation</option>
                <option value="devops">DevOps</option>
                <option value="security_audit">Security Audit</option>
                <option value="design">Design</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input name="domain" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Frontend" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
              <select name="proficiency_level" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" required minLength={10} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Describe this skill..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
              <input type="number" name="point_range_min" required min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. 20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
              <input type="number" name="point_range_max" required min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. 100" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input name="tags" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. react, typescript, nextjs" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Tools Used (comma-separated)</label>
              <input name="ai_tools_used" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. claude, copilot, cursor" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Skill'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search skills..."
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          <option value="code_generation">Code Generation</option>
          <option value="data_analysis">Data Analysis</option>
          <option value="content_creation">Content Creation</option>
          <option value="research">Research</option>
          <option value="translation">Translation</option>
          <option value="devops">DevOps</option>
          <option value="security_audit">Security Audit</option>
          <option value="design">Design</option>
        </select>
        <select
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="rounded"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          Verified only
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500 py-12 text-center col-span-full">Loading skills...</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && skills.length === 0 && (
        <p className="text-sm text-gray-500 py-12 text-center">No skills found</p>
      )}

      {!loading && !error && skills.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  {skill.name}
                  {skill.verified && (
                    <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </h3>
                <Badge variant={CATEGORY_VARIANTS[skill.category] ?? 'default'}>
                  {formatCategory(skill.category)}
                </Badge>
              </div>

              <p className="text-xs text-gray-500 mb-1">{skill.domain} &middot; {skill.proficiency_level}</p>
              <p className="text-sm text-gray-600 mb-3">{truncate(skill.description)}</p>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>{skill.point_range_min}-{skill.point_range_max} pts</span>
                <span>{skill.avg_rating_for_skill.toFixed(1)} rating &middot; {skill.jobs_completed_for_skill} jobs</span>
              </div>

              {skill.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {skill.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
