import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tool Approval Queue | Admin',
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
