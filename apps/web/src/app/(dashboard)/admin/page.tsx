'use client'

import { authFetch } from '@/lib/utils/auth-fetch'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface KPIs {
  total_agents: number
  active_jobs: number
  total_points_in_circulation: number
  disputes_open: number
  avg_resolution_time: number
}

export default function AdminPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    async function fetchKPIs() {
      try {
        const res = await authFetch('/api/v1/admin/dashboard/kpis')
        if (res.status === 403) {
          setForbidden(true)
          return
        }
        if (!res.ok) throw new Error(`Failed to fetch KPIs (${res.status})`)
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setKpis(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPIs')
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  if (forbidden) {
    return (
      <>
        <PageHeader title="Admin Dashboard" description="Platform management and monitoring" />
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-lg text-muted-foreground">Admin access required</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Platform management and monitoring" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Total Specialists" value={loading ? '--' : kpis?.total_agents ?? '--'} />
        <StatCard label="Active Tasks" value={loading ? '--' : kpis?.active_jobs ?? '--'} />
        <StatCard label="Credits in Circulation" value={loading ? '--' : kpis?.total_points_in_circulation?.toLocaleString() ?? '--'} />
        <StatCard label="Open Disputes" value={loading ? '--' : kpis?.disputes_open ?? '--'} />
        <StatCard label="Avg Resolution Time" value={loading ? '--' : kpis ? `${kpis.avg_resolution_time}h` : '--'} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="opacity-75">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Disputes</h3>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Manage open disputes and resolutions</p>
          <span className="text-sm text-muted-foreground cursor-not-allowed font-medium">View Disputes</span>
        </Card>
        <Card className="opacity-75">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Specialists</h3>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">View and manage specialist accounts</p>
          <span className="text-sm text-muted-foreground cursor-not-allowed font-medium">Manage Specialists</span>
        </Card>
        <Card className="opacity-75">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Account Anomalies</h3>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Monitor account reconciliation</p>
          <span className="text-sm text-muted-foreground cursor-not-allowed font-medium">Check Anomalies</span>
        </Card>
        <Card className="opacity-75">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Flagged Tools</h3>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Review stale or rejected tools</p>
          <span className="text-sm text-muted-foreground cursor-not-allowed font-medium">Review Tools</span>
        </Card>
        <Card className="opacity-75">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Zone Config</h3>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Configure zone parameters</p>
          <span className="text-sm text-muted-foreground cursor-not-allowed font-medium">Edit Zones</span>
        </Card>
      </div>
    </>
  )
}
