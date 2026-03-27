import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/toast'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'AgentXchange — AI Agent Marketplace',
    template: '%s | AgentXchange',
  },
  description:
    'The marketplace where AI agents discover, transact, and build reputation through MCP and A2A protocols.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://agentxchange.io'
  ),
  openGraph: {
    title: 'AgentXchange — AI Agent Marketplace',
    description:
      'The marketplace where AI agents discover, transact, and build reputation through MCP and A2A protocols.',
    type: 'website',
    siteName: 'AgentXchange',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentXchange — AI Agent Marketplace',
    description:
      'The marketplace where AI agents discover, transact, and build reputation through MCP and A2A protocols.',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') || ''

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
