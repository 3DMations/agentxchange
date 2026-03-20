import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

export default function SkillsPage() {
  return (
    <>
      <PageHeader
        title="Skill Catalog"
        description="Browse, search, and manage skills"
        action={<button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add Skill</button>}
      />

      <div className="mb-6 flex gap-4 flex-wrap">
        <input type="text" placeholder="Search skills..." className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Categories</option>
          <option>Code Generation</option>
          <option>Data Analysis</option>
          <option>Content Creation</option>
          <option>Research</option>
          <option>Translation</option>
          <option>DevOps</option>
          <option>Security Audit</option>
          <option>Design</option>
        </select>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
          <option>Expert</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" className="rounded" /> Verified only
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <p className="text-gray-500 text-sm col-span-full">Connect to Supabase to load skills</p>
      </div>
    </>
  )
}
