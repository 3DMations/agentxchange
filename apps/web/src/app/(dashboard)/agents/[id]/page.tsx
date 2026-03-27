'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Agent, AgentCard, TrustTier } from '@agentxchange/shared-types'
import type { Skill } from '@agentxchange/shared-types'
import { getCategoryColor } from '@/lib/utils/category-colors'

// --- Types ---

interface AgentProfile extends Agent {
  skills?: Skill[]
}

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string } | null
  meta?: Record<string, unknown>
}

// --- Constants ---

const TRUST_TIER_CONFIG: Record<TrustTier, { label: string; variant: string }> = {
  new: { label: 'New', variant: 'tier-new' },
  bronze: { label: 'Verified', variant: 'tier-bronze' },
  silver: { label: 'Trusted', variant: 'tier-silver' },
  gold: { label: 'Top Rated', variant: 'tier-gold' },
  platinum: { label: 'Elite', variant: 'tier-platinum' },
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
]

const PROFICIENCY_LABELS: Record<string, string> = {
  beginner: 'Junior',
  intermediate: 'Mid-Level',
  advanced: 'Senior',
  expert: 'Expert',
}

// --- Helpers ---

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'bg-blue-500'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function formatSuccessRate(avgRating: number): string {
  // Convert 0-5 rating to percentage
  return `${Math.round((avgRating / 5) * 100)}%`
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function renderStars(rating: number): string {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty)
}

// --- Sub-components ---

function LetterAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase()
  const colorClass = getAvatarColor(name)
  return (
    <div
      className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white ${colorClass}`}
    >
      {letter}
    </div>
  )
}

function TrustBadge({ tier }: { tier: TrustTier }) {
  const config = TRUST_TIER_CONFIG[tier] || TRUST_TIER_CONFIG.new
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function HeaderSection({ profile }: { profile: AgentProfile }) {
  const primaryDomain = profile.skills?.[0]?.category
    ? formatCategory(profile.skills[0].category)
    : 'AI Expert'

  return (
    <Card className="mb-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <LetterAvatar name={profile.handle} />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{profile.handle}</h1>
            <TrustBadge tier={profile.trust_tier} />
          </div>
          {(() => {
            const rawDomain = profile.skills?.[0]?.category
            const domainColors = rawDomain ? getCategoryColor(rawDomain) : null
            return domainColors ? (
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ${domainColors.bg} ${domainColors.text} ${domainColors.darkBg} ${domainColors.darkText}`}>
                {primaryDomain}
              </span>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{primaryDomain}</p>
            )
          })()}

          <div className="mt-4 flex flex-wrap gap-6">
            <StatItem label="Success Rate" value={formatSuccessRate(profile.avg_rating)} />
            <StatItem label="Jobs Completed" value={profile.job_count} />
            <StatItem label="Member Since" value={formatDate(profile.created_at)} />
          </div>
        </div>

        <div className="sm:self-start">
          <Link href={`/new-task?agent_id=${profile.id}`}>
            <Button size="lg">Hire This Expert</Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

function ServicesTab({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">This expert has not listed any services yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {skills.map((skill) => (
        <Card key={skill.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">{skill.name}</h3>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(skill.category).bg} ${getCategoryColor(skill.category).text} ${getCategoryColor(skill.category).darkBg} ${getCategoryColor(skill.category).darkText}`}>
                  {formatCategory(skill.category)}
                </span>
                <Badge variant="info">
                  {PROFICIENCY_LABELS[skill.proficiency_level] || skill.proficiency_level}
                </Badge>
              </div>
              {skill.description && (
                <p className="mt-1 text-sm text-muted-foreground">{skill.description}</p>
              )}
              {skill.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {skill.tags.map((tag) => (
                    <Badge key={tag} variant="default" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                {skill.point_range_min === skill.point_range_max
                  ? `${skill.point_range_min} pts`
                  : `${skill.point_range_min}-${skill.point_range_max} pts`}
              </div>
              {skill.jobs_completed_for_skill > 0 && (
                <div className="text-xs text-muted-foreground">
                  {skill.jobs_completed_for_skill} jobs &middot;{' '}
                  {skill.avg_rating_for_skill.toFixed(1)} avg rating
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ReviewsTab({ profile }: { profile: AgentProfile }) {
  // Reviews are not yet available from the API; show a summary from existing stats
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-foreground">{profile.avg_rating.toFixed(1)}</div>
          <div>
            <div className="text-lg text-amber-500">{renderStars(profile.avg_rating)}</div>
            <div className="text-sm text-muted-foreground">
              Based on {profile.job_count} completed job{profile.job_count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm text-muted-foreground">
          Individual reviews will appear here as clients rate completed work. This expert has
          completed {profile.job_count} job{profile.job_count !== 1 ? 's' : ''} with an average
          rating of {profile.avg_rating.toFixed(1)} out of 5.
        </p>
      </Card>
    </div>
  )
}

function AgentCardTab({ agentId }: { agentId: string }) {
  const [cardData, setCardData] = useState<AgentCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchCard() {
      try {
        const res = await fetch(`/api/v1/agents/${agentId}/card`)
        const json: ApiResponse<AgentCard> = await res.json()
        if (!cancelled) {
          if (json.error) {
            setError(json.error.message)
          } else {
            setCardData(json.data)
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load agent card.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCard()
    return () => {
      cancelled = true
    }
  }, [agentId])

  const handleCopy = useCallback(async () => {
    if (!cardData) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(cardData, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: no-op
    }
  }, [cardData])

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-48 rounded bg-muted" />
        </div>
      </Card>
    )
  }

  if (error || !cardData) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">
          {error || 'Agent card is not available at this time.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="mb-4 text-sm text-muted-foreground">
          Use this Agent Card to integrate with any A2A-compatible system. Copy the JSON below and
          use it to discover and communicate with this expert programmatically.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Agent Card'}
          </Button>
        </div>
        <pre className="mt-3 max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-xs text-foreground">
          <code>{JSON.stringify(cardData, null, 2)}</code>
        </pre>
      </Card>
    </div>
  )
}

// --- Loading / Error states ---

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6 p-6">
      <Card>
        <div className="flex gap-6">
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="flex gap-6">
              <div className="h-10 w-20 rounded bg-muted" />
              <div className="h-10 w-20 rounded bg-muted" />
              <div className="h-10 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      </Card>
      <div className="h-10 w-64 rounded bg-muted" />
      <Card>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </Card>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <Card className="text-center">
        <div className="py-12">
          <h2 className="text-lg font-semibold text-foreground">Unable to load profile</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

// --- Main Page ---

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>()
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/v1/agents/${params.id}/profile`)
        const json: ApiResponse<AgentProfile> = await res.json()
        if (!cancelled) {
          if (json.error) {
            setError(json.error.message)
          } else if (!json.data) {
            setError('Expert not found.')
          } else {
            setProfile(json.data)
          }
        }
      } catch {
        if (!cancelled) setError('Something went wrong. Please try again later.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchProfile()
    return () => {
      cancelled = true
    }
  }, [params.id])

  if (loading) return <LoadingSkeleton />
  if (error || !profile) return <ErrorState message={error || 'Expert not found.'} />

  const skills = profile.skills || []

  return (
    <div className="mx-auto max-w-4xl p-6">
      <HeaderSection profile={profile} />

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="agent-card">Agent Card</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <ServicesTab skills={skills} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsTab profile={profile} />
        </TabsContent>

        <TabsContent value="agent-card">
          <AgentCardTab agentId={profile.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
