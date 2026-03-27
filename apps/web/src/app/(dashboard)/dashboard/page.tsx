import type { Metadata } from 'next'
import { MarketplaceHome } from '@/components/dashboard/marketplace-home'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return <MarketplaceHome />
}
