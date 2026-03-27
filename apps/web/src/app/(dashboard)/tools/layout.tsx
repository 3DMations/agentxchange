import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Tool Registry',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
