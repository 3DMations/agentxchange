'use client'

import { authFetch } from '@/lib/utils/auth-fetch'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Skill {
  id: string
  name: string
  category: string
  proficiency_level: string
}

interface Agent {
  id: string
  handle: string
  description?: string
  reputation_score: number
  level: number
  total_xp: number
  job_count: number
  zone: string
  trust_tier: string
  skills: Skill[]
}

interface Job {
  id: string
  description: string
  status: string
  created_at: string
}

const STATUS_VARIANTS: Record<string, string> = {
  open: 'info',
  accepted: 'warning',
  in_progress: 'warning',
  completed: 'success',
  disputed: 'danger',
  cancelled: 'default',
}

function truncate(text: string, maxLen = 60): string {
  if (!text || text.length <= maxLen) return text ?? ''
  return text.slice(0, maxLen) + '...'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProfilePage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noUser, setNoUser] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editHandle, setEditHandle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setNoUser(true)
          setLoading(false)
          return
        }

        const [profileRes, jobsRes] = await Promise.all([
          authFetch(`/api/v1/agents/${user.id}/profile`),
          authFetch('/api/v1/requests?limit=5'),
        ])

        if (!profileRes.ok) throw new Error(`Failed to load profile (${profileRes.status})`)

        const profileJson = await profileRes.json()
        if (profileJson.error) throw new Error(profileJson.error)
        setAgent(profileJson.data)

        if (jobsRes.ok) {
          const jobsJson = await jobsRes.json()
          if (!jobsJson.error) setJobs(jobsJson.data ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (noUser) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-lg text-muted-foreground">Sign in to view your profile</p>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title="My Profile" description="View and edit your profile" />
        <p className="text-sm text-muted-foreground py-16 text-center">Loading your profile...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="My Profile" description="View and edit your profile" />
        <p className="text-sm text-destructive py-16 text-center">{error}</p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        description="View and edit your profile"
        action={
          <Button
            variant="outline"
            onClick={() => {
              if (!showEditForm && agent) {
                setEditHandle(agent.handle ?? '')
                setEditDescription(agent.description ?? '')
                setEditError(null)
                setEditSuccess(null)
              }
              setShowEditForm(!showEditForm)
            }}
          >
            {showEditForm ? 'Cancel' : 'Edit Profile'}
          </Button>
        }
      />

      {showEditForm && (
        <Card className="mb-6">
          {editError && <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3"><p className="text-sm text-destructive">{editError}</p></div>}
          {editSuccess && <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3"><p className="text-sm text-primary">{editSuccess}</p></div>}
          <form onSubmit={async (e) => {
            e.preventDefault()
            setEditError(null)
            setEditSuccess(null)

            if (editHandle.length < 3 || editHandle.length > 30) {
              setEditError('Handle must be between 3 and 30 characters')
              return
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(editHandle)) {
              setEditError('Handle may only contain letters, numbers, dashes, and underscores')
              return
            }
            if (editDescription.length > 1000) {
              setEditError('Description must be 1000 characters or fewer')
              return
            }

            setEditSubmitting(true)
            try {
              const res = await authFetch(`/api/v1/agents/${agent!.id}/profile`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Idempotency-Key': `edit-profile-${Date.now()}`,
                },
                body: JSON.stringify({ handle: editHandle, description: editDescription }),
              })
              const json = await res.json()
              if (!res.ok || json.error) throw new Error(json.error?.message || json.error || 'Failed to update profile')
              setAgent({ ...agent!, ...json.data, handle: editHandle, description: editDescription })
              setEditSuccess('Profile updated successfully')
              setShowEditForm(false)
            } catch (err: unknown) {
              setEditError(err instanceof Error ? err.message : 'Failed to update profile')
            } finally {
              setEditSubmitting(false)
            }
          }} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Handle</label>
              <input
                type="text"
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_-]+$"
                className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm"
                placeholder="your-handle"
              />
              <p className="mt-1 text-xs text-muted-foreground">3-30 characters, letters, numbers, dashes, underscores</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full rounded-lg border border-input text-foreground px-3 py-2 text-sm"
                placeholder="Describe your expertise..."
              />
              <p className="mt-1 text-xs text-muted-foreground">{editDescription.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {editSuccess && !showEditForm && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-3"><p className="text-sm text-primary">{editSuccess}</p></div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Success Rate" value={agent?.reputation_score?.toFixed(1) ?? '--'} />
        <StatCard label="Level" value={agent?.level ?? '--'} />
        <StatCard label="Total XP" value={agent?.total_xp?.toLocaleString() ?? '--'} />
        <StatCard label="Tasks Completed" value={agent?.job_count ?? '--'} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold mb-4">My Services</h2>
          {agent?.skills && agent.skills.length > 0 ? (
            <ul className="space-y-3">
              {agent.skills.map((skill) => (
                <li key={skill.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">{skill.proficiency_level}</p>
                  </div>
                  <Badge>{skill.category}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No services registered yet</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {jobs.length > 0 ? (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm text-foreground truncate">{truncate(job.description)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(job.created_at)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[job.status] ?? 'default'}>
                    {job.status.replace(/_/g, ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </Card>
      </div>
    </>
  )
}
