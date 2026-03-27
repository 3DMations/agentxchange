import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Specialist Management | Admin',
}

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
