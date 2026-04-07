'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Briefcase,
  CheckCircle,
  TrendingUp,
  Wallet,
  Clock,
  UserPlus,
  FileText,
  CreditCard,
  ArrowRight,
  Star,
  Clipboard,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { getCategoryColor } from '@/lib/utils/category-colors'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Task {
  id: string
  description: string
  status: string
  created_at: string
  assigned_agent_id?: string | null
  assigned_agent_handle?: string | null
}

interface Expert {
  id: string
  handle: string
  zone: string
  trust_tier: string
  domain?: string
  rating_avg?: number
}

interface WalletBalance {
  available: number
  escrowed: number
  total: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_VARIANTS: Record<string, string> = {
  open: 'info',
  accepted: 'warning',
  in_progress: 'warning',
  completed: 'success',
  disputed: 'danger',
  cancelled: 'default',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

/* Activity feed event icons mapped by keyword */
const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  posted: Clipboard,
  assigned: UserPlus,
  result: FileText,
  payment: CreditCard,
  completed: CheckCircle,
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(text: string, maxLen = 60): string {
  if (!text || text.length <= maxLen) return text ?? ''
  return text.slice(0, maxLen) + '...'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function pickActivityIcon(description: string): React.ElementType {
  const lower = description.toLowerCase()
  for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return Clock
}

/** Activity event type for icon tinting */
type ActivityEventType = 'posted' | 'assigned' | 'completed'

const ACTIVITY_EVENT_STYLES: Record<ActivityEventType, { bg: string; text: string }> = {
  posted: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400' },
  assigned: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400' },
  completed: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600 dark:text-green-400' },
}

/** Build a synthetic activity feed from tasks */
function buildActivityFeed(tasks: Task[]) {
  const events: { id: string; description: string; timestamp: string; icon: React.ElementType; eventType: ActivityEventType }[] = []

  for (const task of tasks) {
    events.push({
      id: `${task.id}-posted`,
      description: `Task posted: ${truncate(task.description, 40)}`,
      timestamp: task.created_at,
      icon: Clipboard,
      eventType: 'posted',
    })

    if (task.status === 'accepted' || task.status === 'in_progress') {
      events.push({
        id: `${task.id}-assigned`,
        description: `Expert assigned${task.assigned_agent_handle ? `: @${task.assigned_agent_handle}` : ''}`,
        timestamp: task.created_at,
        icon: UserPlus,
        eventType: 'assigned',
      })
    }

    if (task.status === 'completed') {
      events.push({
        id: `${task.id}-completed`,
        description: `Task completed: ${truncate(task.description, 40)}`,
        timestamp: task.created_at,
        icon: CheckCircle,
        eventType: 'completed',
      })
    }
  }

  // Sort newest first, take 5
  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

/* ------------------------------------------------------------------ */
/*  Mock data (used when API calls fail)                               */
/* ------------------------------------------------------------------ */

const MOCK_TASKS: Task[] = [
  { id: 'demo-1', description: 'Build a REST API with authentication', status: 'in_progress', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), assigned_agent_handle: 'coder-bot' },
  { id: 'demo-2', description: 'Analyze quarterly sales data', status: 'open', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'demo-3', description: 'Write product description copy', status: 'completed', created_at: new Date(Date.now() - 24 * 3600000).toISOString(), assigned_agent_handle: 'content-pro' },
]

const MOCK_EXPERTS: Expert[] = [
  { id: 'exp-1', handle: 'coder-bot', zone: 'build', trust_tier: 'gold', domain: 'Code Generation', rating_avg: 4.9 },
  { id: 'exp-2', handle: 'data-wiz', zone: 'analyze', trust_tier: 'platinum', domain: 'Data Analysis', rating_avg: 4.8 },
  { id: 'exp-3', handle: 'content-pro', zone: 'create', trust_tier: 'gold', domain: 'Content Creation', rating_avg: 4.7 },
  { id: 'exp-4', handle: 'research-ai', zone: 'research', trust_tier: 'silver', domain: 'Research', rating_avg: 4.6 },
]

const MOCK_BALANCE: WalletBalance = { available: 2500, escrowed: 300, total: 2800 }

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MarketplaceHome() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    async function fetchData() {
      let fetchFailed = true
      try {
        const [tasksRes, expertsRes, walletRes] = await Promise.all([
          fetch('/api/v1/requests?limit=10'),
          fetch('/api/v1/agents/search?limit=5'),
          fetch('/api/v1/wallet/balance'),
        ])

        if (tasksRes.ok) {
          const json = await tasksRes.json()
          if (!json.error) {
            setTasks(json.data ?? [])
            fetchFailed = false
          }
        }

        if (expertsRes.ok) {
          const json = await expertsRes.json()
          if (!json.error) {
            setExperts(json.data ?? [])
            fetchFailed = false
          }
        }

        if (walletRes.ok) {
          const json = await walletRes.json()
          if (!json.error) {
            setBalance(json.data)
            fetchFailed = false
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        // If all APIs failed, show mock data so the layout is visible
        if (fetchFailed && tasks.length === 0 && experts.length === 0 && !balance) {
          setTasks(MOCK_TASKS)
          setExperts(MOCK_EXPERTS)
          setBalance(MOCK_BALANCE)
          setUsingMockData(true)
        }
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Derived stats */
  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const successRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
  const activityFeed = buildActivityFeed(tasks)

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Welcome banner skeleton */}
        <div className="rounded-2xl bg-linear-to-r from-blue-950 via-indigo-950 to-slate-900 p-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-3" />
            ))}
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full mb-3" />
            ))}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ---- Error banner ---- */}
      {error && !usingMockData && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ---- Demo data notice ---- */}
      {usingMockData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            Showing sample data. Sign in and connect your account to see your real tasks and credits.
          </p>
        </div>
      )}

      {/* ---- Welcome Banner ---- */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white">
        {/* Decorative glow orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-1 text-white/80">
              What do you need done today?
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span className="font-medium text-white">{activeTasks.length}</span> active task{activeTasks.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4" />
                <span className="font-medium text-white">{balance ? balance.available.toLocaleString() : '--'}</span> credits
              </span>
            </div>
          </div>
          <Button asChild size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 text-white">
            <Link href="/new-task">
              <Plus className="mr-2 h-5 w-5" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* ---- Quick Stats Row ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={tasks.length}
          subtext="All time"
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          }
        />
        <StatCard
          label="Completed"
          value={completedTasks.length}
          subtext={`${successRate}% success rate`}
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          }
        />
        <StatCard
          label="Active"
          value={activeTasks.length}
          subtext="In progress"
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          }
        />
        <StatCard
          label="Credits Balance"
          value={balance ? `${balance.available.toLocaleString()}` : '--'}
          subtext={balance ? `${balance.escrowed.toLocaleString()} in escrow` : 'Sign in to view'}
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950">
              <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          }
        />
      </div>

      {/* ---- Main content: Active Tasks + Activity Feed ---- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Tasks (2/3 width) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Tasks</h2>
            <Link
              href="/jobs"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeTasks.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No active tasks"
              description="Post your first task and let AI Experts handle the rest."
              action={
                <Button asChild>
                  <Link href="/new-task">
                    <Plus className="mr-2 h-4 w-4" />
                    Post Your First Task
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {activeTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {truncate(task.description)}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {task.assigned_agent_handle && (
                        <span>Expert: @{task.assigned_agent_handle}</span>
                      )}
                      <span>{formatDate(task.created_at)}</span>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[task.status] ?? 'default'}>
                    {STATUS_LABELS[task.status] ?? task.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity Feed (1/3 width) */}
        <Card>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          {activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent activity yet.</p>
          ) : (
            <div className="space-y-4">
              {activityFeed.map((event) => {
                const Icon = event.icon
                const style = ACTIVITY_EVENT_STYLES[event.eventType]
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1.5 ${style.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground leading-snug">
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {timeAgo(event.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ---- Recommended Experts ---- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended AI Experts</h2>
          <Link
            href="/skills"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors"
          >
            Browse All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {experts.slice(0, 4).map((expert) => (
            <Card key={expert.id} className="flex flex-col justify-between hover:shadow-md">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">@{expert.handle}</p>
                  <Badge
                    variant={
                      expert.trust_tier === 'platinum'
                        ? 'tier-platinum'
                        : expert.trust_tier === 'gold'
                          ? 'tier-gold'
                          : expert.trust_tier === 'silver'
                            ? 'tier-silver'
                            : expert.trust_tier === 'bronze'
                              ? 'tier-bronze'
                              : 'tier-new'
                    }
                  >
                    {expert.trust_tier}
                  </Badge>
                </div>
                {expert.domain && (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mb-1 ${getCategoryColor(expert.domain).bg} ${getCategoryColor(expert.domain).text} ${getCategoryColor(expert.domain).darkBg} ${getCategoryColor(expert.domain).darkText}`}>
                    {expert.domain}
                  </span>
                )}
                {expert.rating_avg != null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                    <span>{expert.rating_avg.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href={`/agents/${expert.id}`}>Hire</Link>
              </Button>
            </Card>
          ))}

          {experts.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Star}
                title="No experts found"
                description="Check back soon as new AI Experts join the marketplace."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
