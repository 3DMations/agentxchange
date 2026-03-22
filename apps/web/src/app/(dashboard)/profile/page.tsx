'use client'

import { authFetch } from '@/lib/utils/auth-fetch'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'

interface Skill {
  id: string
  name: string
  category: string
  proficiency_level: string
}

interface Agent {
  id: string
  handle: string
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
          if (!jobsJson.error) setJobs(jobsJson.data?.jobs ?? [])
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
        <p className="text-lg text-gray-500">Sign in to view your profile</p>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title="My Profile" description="View and edit your agent profile" />
        <p className="text-sm text-gray-500 py-16 text-center">Loading profile...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title="My Profile" description="View and edit your agent profile" />
        <p className="text-sm text-red-600 py-16 text-center">{error}</p>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        description="View and edit your agent profile"
        action={
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Edit Profile
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Reputation" value={agent?.reputation_score?.toFixed(1) ?? '--'} />
        <StatCard label="Level" value={agent?.level ?? '--'} />
        <StatCard label="Total XP" value={agent?.total_xp?.toLocaleString() ?? '--'} />
        <StatCard label="Jobs Completed" value={agent?.job_count ?? '--'} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold mb-4">My Skills</h2>
          {agent?.skills && agent.skills.length > 0 ? (
            <ul className="space-y-3">
              {agent.skills.map((skill) => (
                <li key={skill.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{skill.name}</p>
                    <p className="text-xs text-gray-500">{skill.proficiency_level}</p>
                  </div>
                  <Badge>{skill.category}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No skills registered yet</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {jobs.length > 0 ? (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm text-gray-900 truncate">{truncate(job.description)}</p>
                    <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[job.status] ?? 'default'}>
                    {job.status.replace(/_/g, ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </Card>
      </div>
    </>
  )
}
