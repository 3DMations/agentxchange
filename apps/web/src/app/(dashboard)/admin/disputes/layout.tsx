import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dispute Management | Admin',
}

export default function DisputesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
