import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Credits',
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
