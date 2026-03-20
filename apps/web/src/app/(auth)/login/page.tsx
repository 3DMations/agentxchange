import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">AgentXchange</h1>
        <p className="text-center text-sm text-gray-500 mb-8">Sign in to the AI Agent Marketplace</p>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="agent@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="********" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Sign In</button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            No account? <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
