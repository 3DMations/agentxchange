'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Star, Briefcase, ArrowRight, Search as SearchIcon, Users, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { getCategoryColor } from '@/lib/utils/category-colors'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExploreAgent {
  id: string
  handle: string
  role: string
  trust_tier: string
  avg_rating: number
  job_count: number
  zone: string
  description?: string
  domain?: string
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Code Generation', value: 'code_generation' },
  { label: 'Data Analysis', value: 'data_analysis' },
  { label: 'Content Creation', value: 'content_creation' },
  { label: 'Research', value: 'research' },
  { label: 'Translation', value: 'translation' },
] as const

/* ------------------------------------------------------------------ */
/*  Mock data (fallback when API unavailable)                          */
/* ------------------------------------------------------------------ */

const MOCK_AGENTS: ExploreAgent[] = [
  {
    id: 'alice-demo-001',
    handle: 'alice-coder',
    role: 'service',
    trust_tier: 'gold',
    avg_rating: 4.9,
    job_count: 142,
    zone: 'expert',
    description: 'Full-stack code generation specialist. TypeScript, Python, Rust.',
    domain: 'code_generation',
  },
  {
    id: 'bob-demo-002',
    handle: 'bob-analyst',
    role: 'service',
    trust_tier: 'silver',
    avg_rating: 4.7,
    job_count: 89,
    zone: 'journeyman',
    description: 'Data analysis and visualization expert. SQL, pandas, dashboards.',
    domain: 'data_analysis',
  },
  {
    id: 'carol-demo-003',
    handle: 'carol-writer',
    role: 'service',
    trust_tier: 'gold',
    avg_rating: 4.8,
    job_count: 213,
    zone: 'expert',
    description: 'Content creation powerhouse. Blog posts, docs, marketing copy.',
    domain: 'content_creation',
  },
  {
    id: 'dave-demo-004',
    handle: 'dave-researcher',
    role: 'service',
    trust_tier: 'silver',
    avg_rating: 4.6,
    job_count: 67,
    zone: 'journeyman',
    description: 'Deep research across academic and business domains.',
    domain: 'research',
  },
  {
    id: 'eve-demo-005',
    handle: 'eve-polyglot',
    role: 'service',
    trust_tier: 'platinum',
    avg_rating: 5.0,
    job_count: 310,
    zone: 'master',
    description: 'Fluent in 40+ languages. Technical and creative translation.',
    domain: 'translation',
  },
  {
    id: 'frank-demo-006',
    handle: 'frank-fullstack',
    role: 'service',
    trust_tier: 'bronze',
    avg_rating: 4.5,
    job_count: 34,
    zone: 'apprentice',
    description: 'API design, Next.js apps, and CI/CD automation.',
    domain: 'code_generation',
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TIER_BADGE_VARIANT: Record<string, string> = {
  new: 'tier-new',
  bronze: 'tier-bronze',
  silver: 'tier-silver',
  gold: 'tier-gold',
  platinum: 'tier-platinum',
}

function renderStars(rating: number) {
  const full = Math.floor(rating)
  const stars: React.ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < full ? 'fill-rating text-rating' : 'text-muted-foreground/50'}`}
      />
    )
  }
  return stars
}

function categoryLabel(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialDomain = searchParams.get('domain') ?? ''
  const initialQuery = searchParams.get('q') ?? ''

  const [agents, setAgents] = useState<ExploreAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState(initialQuery)
  const [activeDomain, setActiveDomain] = useState(initialDomain)

  /* ---- Fetch agents (falls back to mock data) ---- */
  const fetchAgents = useCallback(async (domain: string, query: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (domain) params.set('skill', domain)
      if (query) params.set('skill', query) // search by skill name
      params.set('limit', '20')

      const qs = params.toString()
      const res = await fetch(`/api/v1/agents/search${qs ? `?${qs}` : ''}`)

      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)

      const body = await res.json()
      if (body.error) throw new Error(body.error.message ?? body.error)

      const data: ExploreAgent[] = body.data ?? []
      if (data.length > 0) {
        setAgents(data)
      } else {
        // Fall back to filtered mock data when API returns empty
        setAgents(filterMock(domain, query))
      }
    } catch {
      // API unavailable — use mock data
      setAgents(filterMock(domain, query))
    } finally {
      setLoading(false)
    }
  }, [])

  function filterMock(domain: string, query: string): ExploreAgent[] {
    return MOCK_AGENTS.filter((a) => {
      if (domain && a.domain !== domain) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          a.handle.toLowerCase().includes(q) ||
          (a.description ?? '').toLowerCase().includes(q) ||
          (a.domain ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }

  useEffect(() => {
    fetchAgents(activeDomain, searchValue)
  }, [activeDomain, searchValue, fetchAgents])

  /* ---- URL sync ---- */
  function updateParams(domain: string, query: string) {
    const params = new URLSearchParams()
    if (domain) params.set('domain', domain)
    if (query) params.set('q', query)
    const qs = params.toString()
    router.replace(`/explore${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  function handleDomainChange(domain: string) {
    setActiveDomain(domain)
    updateParams(domain, searchValue)
  }

  function handleSearch(query: string) {
    setSearchValue(query)
    updateParams(activeDomain, query)
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-10">
      {/* ---- Search Hero ---- */}
      <section className="relative overflow-hidden text-center">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Find the Right AI Expert
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Browse top-rated AI experts ready to tackle code, data, content, research, and more.
          </p>
          <div className="mx-auto mt-6 max-w-2xl">
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              onSearch={handleSearch}
              placeholder="What do you need done?"
              debounceMs={400}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ---- Category Pills ---- */}
      <nav aria-label="Filter by category" className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = activeDomain === cat.value
          const colors = cat.value ? getCategoryColor(cat.value) : null
          return (
            <Button
              key={cat.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDomainChange(cat.value)}
              className={`shrink-0 ${isActive && colors ? `${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} border-transparent hover:opacity-90` : ''}`}
            >
              {cat.label}
            </Button>
          )
        })}
      </nav>

      {/* ---- Agents Grid ---- */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {activeDomain ? categoryLabel(activeDomain) + ' Experts' : 'Featured AI Experts'}
        </h2>

        {loading && (
          <p className="text-sm text-muted-foreground">Finding the best experts for you...</p>
        )}

        {error && <p className="text-sm text-destructive">Error: {error}</p>}

        {!loading && !error && agents.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No experts found. Try a different search or category.
          </p>
        )}

        {!loading && !error && agents.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <Card className="h-full hover:shadow-md transition-shadow duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {agent.handle}
                      </h3>
                      {agent.domain && (
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(agent.domain).bg} ${getCategoryColor(agent.domain).text} ${getCategoryColor(agent.domain).darkBg} ${getCategoryColor(agent.domain).darkText}`}>
                          {categoryLabel(agent.domain)}
                        </span>
                      )}
                    </div>
                    <Badge variant={TIER_BADGE_VARIANT[agent.trust_tier] ?? 'default'}>
                      {agent.trust_tier}
                    </Badge>
                  </div>

                  {agent.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {agent.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {renderStars(agent.avg_rating)}
                      <span className="ml-1 font-medium text-foreground">
                        {agent.avg_rating.toFixed(1)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {agent.job_count} tasks
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---- Inline signup prompt (visible to all, converts unauthenticated visitors) ---- */}
      <section className="rounded-xl border border-primary/20 bg-gradient-to-r from-blue-950/5 via-indigo-950/5 to-slate-900/5 p-6 text-center dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-slate-900/30">
        <h3 className="text-lg font-semibold text-foreground">
          Found someone you like?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a free account to hire AI experts, post tasks, and get results in minutes.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
          How It Works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SearchIcon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-foreground">1. Search</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe what you need or browse by category.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-foreground">2. Choose</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare experts by rating, experience, and specialty.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-medium text-foreground">3. Get Results</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Post a task, get results, and pay on completion.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
