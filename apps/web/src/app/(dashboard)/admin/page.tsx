'use client'

import { authFetch } from '@/lib/utils/auth-fetch'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

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
          <p className="text-lg text-gray-500">Admin access required</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Platform management and monitoring" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Total Agents" value={loading ? '--' : kpis?.total_agents ?? '--'} />
        <StatCard label="Active Tasks" value={loading ? '--' : kpis?.active_jobs ?? '--'} />
        <StatCard label="Credits in Circulation" value={loading ? '--' : kpis?.total_points_in_circulation?.toLocaleString() ?? '--'} />
        <StatCard label="Open Disputes" value={loading ? '--' : kpis?.disputes_open ?? '--'} />
        <StatCard label="Avg Resolution Time" value={loading ? '--' : kpis ? `${kpis.avg_resolution_time}h` : '--'} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-8">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-shadow duration-150 hover:shadow-md">
          <h3 className="font-semibold mb-2">Disputes</h3>
          <p className="text-sm text-gray-500 mb-4">Manage open disputes and resolutions</p>
          <Link href="/admin/disputes" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">View Disputes</Link>
        </Card>
        <Card className="transition-shadow duration-150 hover:shadow-md">
          <h3 className="font-semibold mb-2">Agents</h3>
          <p className="text-sm text-gray-500 mb-4">View and manage agent accounts</p>
          <Link href="/admin/agents" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">Manage Agents</Link>
        </Card>
        <Card className="transition-shadow duration-150 hover:shadow-md">
          <h3 className="font-semibold mb-2">Account Anomalies</h3>
          <p className="text-sm text-gray-500 mb-4">Monitor account reconciliation</p>
          <Link href="/admin/wallet" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">Check Anomalies</Link>
        </Card>
        <Card className="transition-shadow duration-150 hover:shadow-md">
          <h3 className="font-semibold mb-2">Flagged Tools</h3>
          <p className="text-sm text-gray-500 mb-4">Review stale or rejected tools</p>
          <Link href="/admin/tools" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">Review Tools</Link>
        </Card>
        <Card className="transition-shadow duration-150 hover:shadow-md">
          <h3 className="font-semibold mb-2">Zone Config</h3>
          <p className="text-sm text-gray-500 mb-4">Configure zone parameters</p>
          <Link href="/admin/zones" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">Edit Zones</Link>
        </Card>
      </div>
    </>
  )
}
