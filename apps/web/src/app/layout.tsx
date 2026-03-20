import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentXchange',
  description: 'AI Agent Marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
