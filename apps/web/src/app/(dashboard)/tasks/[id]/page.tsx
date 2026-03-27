'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface TaskData {
  id: string
  client_agent_id: string
  service_agent_id: string | null
  status: string
  description: string
  acceptance_criteria: string
  point_budget: number
  point_quote: number | null
  zone_at_creation: string
  tools_used: string[]
  created_at: string
  accepted_at: string | null
  submitted_at: string | null
  reviewed_at: string | null
  helpfulness_score: number | null
  solved: boolean | null
  dispute_id: string | null
}

interface ExpertInfo {
  id: string
  handle: string
  solve_rate: number
  avg_rating: number
  reputation_score: number
  zone: string
}

interface DeliverableInfo {
  id: string
  job_id: string
  agent_id: string
  submitted_at: string
  metadata: {
    title: string
    summary: string
    assumptions: string[]
    steps: string[]
    tags: string[]
  }
}

/* -------------------------------------------------------------------------- */
/*  Status mapping (API -> consumer-friendly)                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_STATUS = { label: 'Open', variant: 'info', bannerClass: 'bg-blue-500', icon: '📋' } as const

const STATUS_CONFIG: Record<string, { label: string; variant: string; bannerClass: string; icon: string }> = {
  open:         { label: 'Open',          variant: 'info',    bannerClass: 'bg-blue-500',    icon: '📋' },
  accepted:     { label: 'Assigned',      variant: 'warning', bannerClass: 'bg-yellow-500',  icon: '🤝' },
  in_progress:  { label: 'In Progress',   variant: 'warning', bannerClass: 'bg-yellow-500',  icon: '⚙️' },
  submitted:    { label: 'Under Review',  variant: 'info',    bannerClass: 'bg-purple-500',  icon: '🔍' },
  under_review: { label: 'Under Review',  variant: 'info',    bannerClass: 'bg-purple-500',  icon: '🔍' },
  completed:    { label: 'Completed',     variant: 'success', bannerClass: 'bg-green-500',   icon: '✅' },
  disputed:     { label: 'Disputed',      variant: 'danger',  bannerClass: 'bg-red-500',     icon: '⚠️' },
  cancelled:    { label: 'Cancelled',     variant: 'default', bannerClass: 'bg-gray-500',    icon: '🚫' },
}

const CREDITS_TO_DOLLARS = 0.10

/* -------------------------------------------------------------------------- */
/*  Timeline                                                                  */
/* -------------------------------------------------------------------------- */

interface TimelineStep {
  label: string
  date: string | null
  status: 'completed' | 'current' | 'upcoming'
}

function buildTimeline(task: TaskData): TimelineStep[] {
  const statusOrder = ['open', 'accepted', 'in_progress', 'submitted', 'completed']
  const currentIdx = statusOrder.indexOf(task.status)

  const steps: TimelineStep[] = [
    {
      label: 'Task Posted',
      date: task.created_at,
      status: currentIdx >= 0 ? 'completed' : 'upcoming',
    },
    {
      label: 'Expert Assigned',
      date: task.accepted_at,
      status: currentIdx >= 1 ? 'completed' : currentIdx === 0 ? 'current' : 'upcoming',
    },
    {
      label: 'Work Started',
      date: task.accepted_at,
      status: currentIdx >= 2 ? 'completed' : currentIdx === 1 ? 'current' : 'upcoming',
    },
    {
      label: 'Results Submitted',
      date: task.submitted_at,
      status: currentIdx >= 3 ? 'completed' : currentIdx === 2 ? 'current' : 'upcoming',
    },
    {
      label: 'Task Completed',
      date: task.reviewed_at,
      status: currentIdx >= 4 ? 'completed' : currentIdx === 3 ? 'current' : 'upcoming',
    },
  ]

  if (task.status === 'disputed') {
    steps.push({
      label: 'Dispute Opened',
      date: null,
      status: 'current',
    })
  }

  if (task.status === 'cancelled') {
    steps.push({
      label: 'Task Cancelled',
      date: null,
      status: 'current',
    })
  }

  return steps
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function creditsToDollars(credits: number): string {
  return `$${(credits * CREDITS_TO_DOLLARS).toFixed(2)}`
}

/* -------------------------------------------------------------------------- */
/*  Mock data for graceful fallback                                           */
/* -------------------------------------------------------------------------- */

function getMockTask(id: string): TaskData {
  return {
    id,
    client_agent_id: 'mock-client-001',
    service_agent_id: 'mock-expert-001',
    status: 'in_progress',
    description:
      'Build a REST API integration that connects our inventory system with the e-commerce platform. Should handle product sync, stock level updates, and order fulfillment webhooks.',
    acceptance_criteria:
      'All endpoints documented with OpenAPI spec. Integration tests passing. Error handling for network failures with retry logic.',
    point_budget: 500,
    point_quote: 450,
    zone_at_creation: 'journeyman',
    tools_used: ['typescript', 'node-fetch', 'zod'],
    created_at: '2026-03-20T10:00:00Z',
    accepted_at: '2026-03-21T14:30:00Z',
    submitted_at: null,
    reviewed_at: null,
    helpfulness_score: null,
    solved: null,
    dispute_id: null,
  }
}

function getMockExpert(): ExpertInfo {
  return {
    id: 'mock-expert-001',
    handle: 'integration-pro',
    solve_rate: 0.94,
    avg_rating: 4.8,
    reputation_score: 88,
    zone: 'expert',
  }
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function StatusBanner({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS
  return (
    <div className={cn('w-full rounded-lg px-6 py-4 text-white', config.bannerClass)}>
      <div className="flex items-center gap-3">
        <span className="text-xl" role="img" aria-label={config.label}>
          {config.icon}
        </span>
        <span className="text-lg font-semibold">{config.label}</span>
      </div>
    </div>
  )
}

function ProgressTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-4">
          {/* vertical connector + dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'h-3 w-3 rounded-full border-2 shrink-0',
                step.status === 'completed' && 'border-green-500 bg-green-500',
                step.status === 'current' && 'border-blue-500 bg-blue-100',
                step.status === 'upcoming' && 'border-input bg-background'
              )}
            />
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'w-0.5 flex-1 min-h-[2rem]',
                  step.status === 'completed' ? 'bg-green-300' : 'bg-border'
                )}
              />
            )}
          </div>

          {/* label + date */}
          <div className="pb-6">
            <p
              className={cn(
                'text-sm font-medium -mt-0.5',
                step.status === 'completed' && 'text-foreground',
                step.status === 'current' && 'text-blue-600',
                step.status === 'upcoming' && 'text-muted-foreground'
              )}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(step.date)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            'text-2xl transition-colors',
            star <= value ? 'text-rating' : 'text-muted-foreground/50'
          )}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="rectangular" className="h-16 w-full" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Skeleton variant="rectangular" className="h-48 w-full" />
          <Skeleton variant="rectangular" className="h-48 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton variant="rectangular" className="h-40 w-full" />
          <Skeleton variant="rectangular" className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main page component                                                       */
/* -------------------------------------------------------------------------- */

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const taskId = params.id

  const [task, setTask] = useState<TaskData | null>(null)
  const [expert, setExpert] = useState<ExpertInfo | null>(null)
  const [deliverable, setDeliverable] = useState<DeliverableInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [usingMockData, setUsingMockData] = useState(false)

  /* ---- Fetch task ---- */
  const fetchTask = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/requests/${taskId}`)
      if (!res.ok) throw new Error(`Failed to load task (${res.status})`)
      const body = await res.json()
      if (body.error) throw new Error(typeof body.error === 'string' ? body.error : body.error.message ?? 'Unknown error')
      setTask(body.data)
      setUsingMockData(false)

      // Fetch assigned expert info if available
      if (body.data?.service_agent_id) {
        try {
          const agentRes = await fetch(`/api/v1/agents/${body.data.service_agent_id}/profile`)
          if (agentRes.ok) {
            const agentBody = await agentRes.json()
            if (agentBody.data) setExpert(agentBody.data)
          }
        } catch {
          // Expert info is supplementary; don't fail the page
        }
      }

      // Fetch deliverable if task is submitted/under_review/completed
      const deliverableStatuses = ['submitted', 'under_review', 'completed']
      if (deliverableStatuses.includes(body.data?.status)) {
        try {
          const delRes = await fetch(`/api/v1/deliverables?job_id=${taskId}`)
          if (delRes.ok) {
            const delBody = await delRes.json()
            const items = delBody.data ?? []
            if (items.length > 0) setDeliverable(items[0])
          }
        } catch {
          // Deliverable info is supplementary
        }
      }
    } catch {
      // Graceful fallback to mock data
      setTask(getMockTask(taskId))
      setExpert(getMockExpert())
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  /* ---- Actions ---- */
  async function handleAction(action: string) {
    if (!task) return
    setActionLoading(action)
    try {
      let url = ''
      let method = 'POST'
      let body: Record<string, unknown> | undefined

      switch (action) {
        case 'cancel':
          url = `/api/v1/requests/${task.id}`
          method = 'PATCH'
          body = { status: 'cancelled' }
          break
        case 'approve':
          url = `/api/v1/requests/${task.id}/submit`
          method = 'POST'
          body = { action: 'approve' }
          break
        case 'request_changes':
          url = `/api/v1/requests/${task.id}/submit`
          method = 'POST'
          body = { action: 'request_changes' }
          break
        case 'dispute':
          url = `/api/v1/requests/${task.id}/submit`
          method = 'POST'
          body = { action: 'dispute' }
          break
        case 'rate':
          if (rating === 0) return
          url = `/api/v1/requests/${task.id}/rate`
          method = 'POST'
          body = { helpfulness_score: rating }
          break
        default:
          return
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `task-${action}-${task.id}-${Date.now()}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error?.message ?? `Action failed (${res.status})`)
      }

      // Refresh task data after successful action
      await fetchTask()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  /* ---- Render ---- */
  if (loading) return <LoadingSkeleton />

  if (!task) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-foreground">Task not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The task you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/jobs')}>
          Back to Task Board
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[task.status] ?? DEFAULT_STATUS
  const timeline = buildTimeline(task)
  const isOpen = task.status === 'open'
  const isUnderReview = task.status === 'submitted' || task.status === 'under_review'
  const isCompleted = task.status === 'completed'
  const hasExpert = !!task.service_agent_id

  return (
    <div className="space-y-6">
      {/* Mock data notice */}
      {usingMockData && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3">
          <p className="text-sm text-yellow-800">
            Showing sample data. The API is currently unavailable.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Back link */}
      <button
        onClick={() => router.push('/jobs')}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span aria-hidden="true">&larr;</span> Back to Task Board
      </button>

      {/* Status Banner */}
      <StatusBanner status={task.status} />

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: details + deliverable */}
        <div className="md:col-span-2 space-y-6">
          {/* Task details */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Acceptance Criteria</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">{task.acceptance_criteria}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-semibold text-foreground">
                    {task.point_budget} credits
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({creditsToDollars(task.point_budget)})
                    </span>
                  </p>
                </div>

                {task.point_quote !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Quote</p>
                    <p className="text-sm font-semibold text-foreground">
                      {task.point_quote} credits
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({creditsToDollars(task.point_quote)})
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Posted</p>
                  <p className="text-sm text-foreground">{formatDate(task.created_at)}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Zone</p>
                  <p className="text-sm text-foreground capitalize">{task.zone_at_creation}</p>
                </div>
              </div>

              {task.tools_used.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tools_used.map((tool) => (
                      <Badge key={tool} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Deliverable / Results */}
          {deliverable && (
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Results</h2>

                {deliverable.metadata?.title && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Title</h3>
                    <p className="text-sm text-foreground">{deliverable.metadata.title}</p>
                  </div>
                )}

                {deliverable.metadata?.summary && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Summary</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {deliverable.metadata.summary}
                    </p>
                  </div>
                )}

                {deliverable.metadata?.steps?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Steps Taken</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
                      {deliverable.metadata.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {deliverable.metadata?.assumptions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Assumptions</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                      {deliverable.metadata.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {deliverable.metadata?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {deliverable.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Submitted {formatDateTime(deliverable.submitted_at)}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Actions</h2>

              {isOpen && (
                <div>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading === 'cancel'}
                  >
                    {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Task'}
                  </Button>
                </div>
              )}

              {isUnderReview && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'approve' ? 'Approving...' : 'Approve & Pay'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction('request_changes')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'request_changes' ? 'Requesting...' : 'Request Changes'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('dispute')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'dispute' ? 'Filing...' : 'Dispute'}
                  </Button>
                </div>
              )}

              {isCompleted && !task.helpfulness_score && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    How helpful were the results?
                  </p>
                  <StarRating value={rating} onChange={setRating} />
                  <Button
                    onClick={() => handleAction('rate')}
                    disabled={rating === 0 || actionLoading === 'rate'}
                  >
                    {actionLoading === 'rate' ? 'Submitting...' : 'Leave a Review'}
                  </Button>
                </div>
              )}

              {isCompleted && task.helpfulness_score !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Your rating:</span>
                  <span className="text-rating text-lg">
                    {'★'.repeat(task.helpfulness_score)}
                    {'☆'.repeat(5 - task.helpfulness_score)}
                  </span>
                </div>
              )}

              {!isOpen && !isUnderReview && !isCompleted && (
                <p className="text-sm text-muted-foreground">
                  No actions available for this task status.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Right column: expert + timeline */}
        <div className="space-y-6">
          {/* Assigned Expert */}
          {hasExpert && (
            <Card>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Assigned Expert</h2>
                {expert ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {expert.handle.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">@{expert.handle}</p>
                        <p className="text-xs text-muted-foreground capitalize">{expert.zone} zone</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                        <p className="font-medium text-foreground">
                          {(expert.solve_rate * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Rating</p>
                        <p className="font-medium text-foreground">
                          {expert.avg_rating.toFixed(1)} / 5.0
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reputation</p>
                        <p className="font-medium text-foreground">{expert.reputation_score}</p>
                      </div>
                    </div>

                    {task.accepted_at && (
                      <p className="text-xs text-muted-foreground">
                        Assigned {formatDate(task.accepted_at)}
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/agents/${expert.id}`)}
                    >
                      View Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton variant="rectangular" className="h-10 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                )}
              </div>
            </Card>
          )}

          {!hasExpert && (
            <Card>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Assigned Expert</h2>
                <p className="text-sm text-muted-foreground">
                  No expert assigned yet. The task is waiting for someone to accept it.
                </p>
              </div>
            </Card>
          )}

          {/* Progress Timeline */}
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Progress</h2>
              <ProgressTimeline steps={timeline} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
