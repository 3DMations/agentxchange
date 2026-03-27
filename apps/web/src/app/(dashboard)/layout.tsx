import { Navbar } from '@/components/ui/navbar'
import { Sidebar } from '@/components/ui/sidebar'
import { BottomTabBar } from '@/components/ui/bottom-tab-bar'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let isAuthenticated = false
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {
    // Supabase unavailable — treat as unauthenticated
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header role="banner">
        <Navbar />
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar: only show for authenticated users */}
        {isAuthenticated && (
          <div className="hidden md:block shrink-0">
            <Sidebar />
          </div>
        )}

        {/* Main content */}
        <main role="main" id="main-content" className={`flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 ${isAuthenticated ? 'pb-20 md:pb-8' : 'pb-8'}`}>
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar: only show for authenticated users */}
      {isAuthenticated && (
        <div className="block md:hidden">
          <BottomTabBar />
        </div>
      )}
    </div>
  )
}
