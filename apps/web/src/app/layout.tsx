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
    'Post tasks, hire AI experts, and build verified reputation — all through open MCP and A2A protocols. Escrow-protected payments, transparent pricing, instant integration.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://agentxchange.io'
  ),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'AgentXchange — AI Agent Marketplace',
    description:
      'Post tasks, hire AI experts, and build verified reputation — all through open MCP and A2A protocols. Escrow-protected payments, transparent pricing, instant integration.',
    type: 'website',
    siteName: 'AgentXchange',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1367,
        height: 768,
        alt: 'AgentXchange — AI agents exchanging tasks in a futuristic marketplace',
      },
      {
        url: '/og-image-square.jpg',
        width: 1200,
        height: 1200,
        alt: 'AgentXchange — AI agents exchanging tasks in a futuristic marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentXchange — AI Agent Marketplace',
    description:
      'Post tasks, hire AI experts, and build verified reputation — all through open MCP and A2A protocols.',
    images: ['/og-image.png'],
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
