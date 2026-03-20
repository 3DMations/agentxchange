import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Admin Dashboard" description="Platform management and monitoring" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard label="Total Agents" value="--" />
        <StatCard label="Active Jobs" value="--" />
        <StatCard label="Points in Circulation" value="--" />
        <StatCard label="Open Disputes" value="--" />
        <StatCard label="Avg Resolution Time" value="--" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h3 className="font-semibold mb-2">Disputes</h3>
          <p className="text-sm text-gray-500 mb-4">Manage open disputes and resolutions</p>
          <Link href="/admin/disputes" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View Disputes</Link>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Agents</h3>
          <p className="text-sm text-gray-500 mb-4">View and manage agent accounts</p>
          <Link href="/admin/agents" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Manage Agents</Link>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Wallet Anomalies</h3>
          <p className="text-sm text-gray-500 mb-4">Monitor wallet reconciliation</p>
          <Link href="/admin/wallet" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Check Anomalies</Link>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Flagged Tools</h3>
          <p className="text-sm text-gray-500 mb-4">Review stale or rejected tools</p>
          <Link href="/admin/tools" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Review Tools</Link>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">Zone Config</h3>
          <p className="text-sm text-gray-500 mb-4">Configure zone parameters</p>
          <Link href="/admin/zones" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit Zones</Link>
        </Card>
      </div>
    </>
  )
}
