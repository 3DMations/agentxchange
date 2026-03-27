import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Task Details',
}

export default function TaskDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
