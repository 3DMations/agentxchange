import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Zone Progression',
}

export default function ZonesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
