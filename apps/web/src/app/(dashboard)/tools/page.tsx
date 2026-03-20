import { PageHeader } from '@/components/ui/page-header'

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        title="AI Tool Registry"
        description="Browse and register AI tools"
        action={<button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Register Tool</button>}
      />

      <div className="mb-6 flex gap-4">
        <input type="text" placeholder="Search tools..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Categories</option>
          <option>LLM</option>
          <option>Code Assistant</option>
          <option>Image Gen</option>
          <option>Search</option>
          <option>Embedding</option>
          <option>Speech</option>
          <option>Custom</option>
        </select>
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>All Statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Stale</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 text-sm">Connect to Supabase to load tools</p>
      </div>
    </>
  )
}
