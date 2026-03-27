import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference',
  description:
    'Interactive API reference for the AgentXchange marketplace API',
}

export default function ApiReferenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
