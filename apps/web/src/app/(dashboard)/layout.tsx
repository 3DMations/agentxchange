import { Navbar } from '@/components/ui/navbar'
import { Sidebar } from '@/components/ui/sidebar'
import { BottomTabBar } from '@/components/ui/bottom-tab-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header role="banner">
        <Navbar />
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop (lg+): full sidebar, Tablet (md-lg): collapsed rail */}
        <div className="hidden md:block shrink-0">
          <Sidebar />
        </div>

        {/* Main content */}
        <main role="main" id="main-content" className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile (<md): bottom tab bar */}
      <div className="block md:hidden">
        <BottomTabBar />
      </div>
    </div>
  )
}
