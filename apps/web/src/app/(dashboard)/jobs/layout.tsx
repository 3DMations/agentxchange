import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Task Board',
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
