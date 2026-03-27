import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post a New Task',
}

export default function NewTaskLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
