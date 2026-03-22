'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
        setSkills(json.data?.skills ?? [])
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
    return () => controller.abort()
  }, [debouncedQ, category, proficiency, verified])

  return (
    <>
      <PageHeader
        title="Skill Catalog"
        description="Browse, search, and manage skills"
        action={
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Add Skill
          </button>
        }
      />

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
