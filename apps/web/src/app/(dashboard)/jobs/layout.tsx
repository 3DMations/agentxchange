import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Job Exchange',
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
