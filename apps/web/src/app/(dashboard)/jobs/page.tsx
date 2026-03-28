'use client'


import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Job {
  id: string
  description: string
  status: string
  point_budget: number
  zone_at_creation: string
  created_at: string
  acceptance_criteria: string
}

const STATUS_BADGE_VARIANT: Record<string, string> = {
  open: 'info',
  accepted: 'warning',
  in_progress: 'warning',
  completed: 'success',
  disputed: 'danger',
  cancelled: 'default',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncate(text: string, maxLen = 120): string {
  if (!text || text.length <= maxLen) return text ?? ''
  return text.slice(0, maxLen) + '...'
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [zone, setZone] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (zone) params.set('zone', zone)
    if (minBudget) params.set('min_budget', minBudget)
    if (maxBudget) params.set('max_budget', maxBudget)

    const qs = params.toString()
    const url = `/api/v1/requests${qs ? `?${qs}` : ''}`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch jobs (${res.status})`)
      }
      const body = await res.json()
      if (body.error) {
        throw new Error(body.error)
      }
      setJobs(body.data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [status, zone, minBudget, maxBudget])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <>
      <PageHeader
        title="Task Board"
        description="Browse and post tasks"
        action={
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'}>
            {showForm ? 'Cancel' : 'Post a Task'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          {formError && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3"><p className="text-sm text-destructive">{formError}</p></div>}
          {formSuccess && <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3"><p className="text-sm text-primary">{formSuccess}</p></div>}
          <form onSubmit={async (e) => {
            e.preventDefault()
            setFormError(null); setFormSuccess(null); setSubmitting(true)
            const fd = new FormData(e.currentTarget)
            try {
              const res = await fetch('/api/v1/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `job-${Date.now()}` },
                body: JSON.stringify({
                  description: fd.get('description'),
                  acceptance_criteria: fd.get('acceptance_criteria'),
                  point_budget: Number(fd.get('point_budget')),
                }),
              })
              const json = await res.json()
              if (!res.ok || json.error) throw new Error(json.error?.message || 'Failed to create task')
              setFormSuccess('Task posted!'); setShowForm(false); fetchJobs()
            } catch (err: unknown) { setFormError(err instanceof Error ? err.message : 'Failed') }
            finally { setSubmitting(false) }
          }} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea name="description" required minLength={10} rows={3} className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm" placeholder="Describe the task..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Acceptance Criteria</label>
              <textarea name="acceptance_criteria" required minLength={10} rows={2} className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm" placeholder="What must be delivered..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Credit Budget</label>
              <input type="number" name="point_budget" required min={1} className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm" placeholder="e.g. 100" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Submit Task'}
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <select
          className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm sm:w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm sm:w-auto"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          <option value="">All Zones</option>
          <option value="starter">Starter</option>
          <option value="apprentice">Apprentice</option>
          <option value="journeyman">Journeyman</option>
          <option value="expert">Expert</option>
          <option value="master">Master</option>
        </select>
        <div className="flex gap-3 sm:gap-4">
          <input
            type="number"
            placeholder="Min budget"
            className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm sm:w-32"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max budget"
            className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm sm:w-32"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <p className="text-muted-foreground text-sm">Finding the best options for you...</p>
        )}

        {error && (
          <p className="text-destructive text-sm">Error: {error}</p>
        )}

        {!loading && !error && jobs.length === 0 && (
          <p className="text-muted-foreground text-sm">No tasks found yet.</p>
        )}

        {!loading &&
          !error &&
          jobs.map((job) => (
            <Card key={job.id} className="transition-shadow duration-150 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    {truncate(job.description)}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{job.point_budget} credits</span>
                    <span>Zone: {job.zone_at_creation}</span>
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[job.status] ?? 'default'}>
                  {job.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </Card>
          ))}
      </div>
    </>
  )
}
