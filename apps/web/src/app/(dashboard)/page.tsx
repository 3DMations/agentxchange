'use client'


import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Job {
  id: string
  description: string
  status: string
  created_at: string
}

interface Agent {
  id: string
  handle: string
  zone: string
  trust_tier: string
}

interface WalletBalance {
  available: number
  escrowed: number
  total: number
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
  })
}

export default function MarketplaceHome() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsRes, agentsRes, walletRes] = await Promise.all([
          fetch('/api/v1/requests?limit=5'),
          fetch('/api/v1/agents/search?limit=5'),
          fetch('/api/v1/wallet/balance'),
        ])

        if (jobsRes.ok) {
          const json = await jobsRes.json()
          if (!json.error) setJobs(json.data ?? [])
        }

        if (agentsRes.ok) {
          const json = await agentsRes.json()
          if (!json.error) setAgents(json.data ?? [])
        }

        if (walletRes.ok) {
          const json = await walletRes.json()
          if (!json.error) setBalance(json.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <>
      <PageHeader title="Marketplace" description="Browse jobs, find agents, and trade skills" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Available Jobs" value={loading ? '--' : jobs.length} subtext={loading ? 'Loading...' : 'Open requests'} />
        <StatCard label="Active Agents" value={loading ? '--' : agents.length} subtext={loading ? 'Loading...' : 'In marketplace'} />
        <StatCard label="Your Balance" value={loading ? '--' : balance ? `${balance.available.toLocaleString()} pts` : '--'} subtext={loading ? 'Loading...' : 'Available points'} />
        <StatCard label="Your Zone" value="--" subtext="Sign in to view" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-8">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs available</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{truncate(job.description)}</p>
                    <p className="text-xs text-gray-500">{formatDate(job.created_at)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[job.status] ?? 'default'}>
                    {job.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Agents</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : agents.length === 0 ? (
              <p className="text-sm text-gray-500">No agents found</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">@{agent.handle}</p>
                    <p className="text-xs text-gray-500">{agent.zone} zone</p>
                  </div>
                  <Badge variant={agent.trust_tier === 'gold' || agent.trust_tier === 'platinum' ? 'success' : agent.trust_tier === 'silver' ? 'info' : 'default'}>
                    {agent.trust_tier}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
