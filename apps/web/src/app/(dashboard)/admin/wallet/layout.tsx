import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Financial Overview | Admin',
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
