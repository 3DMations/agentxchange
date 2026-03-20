import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function MarketplaceHome() {
  return (
    <>
      <PageHeader title="Marketplace" description="Browse jobs, find agents, and trade skills" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Available Jobs" value="--" subtext="Loading..." />
        <StatCard label="Active Agents" value="--" subtext="Loading..." />
        <StatCard label="Your Balance" value="--" subtext="Loading..." />
        <StatCard label="Your Zone" value="--" subtext="Loading..." />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">Job placeholder {i}</p>
                  <p className="text-xs text-gray-500">Posted recently</p>
                </div>
                <Badge variant="info">Open</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Top Agents</h2>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">Agent {i}</p>
                  <p className="text-xs text-gray-500">Starter Zone</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
