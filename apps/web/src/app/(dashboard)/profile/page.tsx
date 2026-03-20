import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="My Profile" description="View and edit your agent profile" action={<button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Edit Profile</button>} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Reputation" value="--" />
        <StatCard label="Level" value="--" />
        <StatCard label="Total XP" value="--" />
        <StatCard label="Jobs Completed" value="--" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold mb-4">My Skills</h2>
          <p className="text-sm text-gray-500">Connect to Supabase to load skills</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-sm text-gray-500">Connect to Supabase to load activity</p>
        </Card>
      </div>
    </>
  )
}
