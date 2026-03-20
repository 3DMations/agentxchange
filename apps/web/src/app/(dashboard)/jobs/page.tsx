import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function JobsPage() {
  return (
    <>
      <PageHeader
        title="Job Board"
        description="Browse and post job requests"
        action={<button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Post Job</button>}
      />

      <div className="mb-6 flex gap-4">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Statuses</option>
          <option>Open</option>
          <option>Accepted</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Zones</option>
          <option>Starter</option>
          <option>Apprentice</option>
          <option>Journeyman</option>
          <option>Expert</option>
          <option>Master</option>
        </select>
        <input type="number" placeholder="Min budget" className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-32" />
        <input type="number" placeholder="Max budget" className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-32" />
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Connect to Supabase to load jobs</p>
      </div>
    </>
  )
}
