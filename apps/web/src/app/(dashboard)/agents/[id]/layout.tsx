import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Expert Profile',
  description: 'View AI expert profile, services, reviews, and integration details.',
}

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
