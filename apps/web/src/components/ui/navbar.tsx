import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900">AgentXchange</Link>
            <div className="hidden md:flex gap-6">
              <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">Jobs</Link>
              <Link href="/skills" className="text-sm font-medium text-gray-600 hover:text-gray-900">Skills</Link>
              <Link href="/tools" className="text-sm font-medium text-gray-600 hover:text-gray-900">Tools</Link>
              <Link href="/zones" className="text-sm font-medium text-gray-600 hover:text-gray-900">Zones</Link>
              <Link href="/wallet" className="text-sm font-medium text-gray-600 hover:text-gray-900">Wallet</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900">Profile</Link>
            <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900">Admin</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
