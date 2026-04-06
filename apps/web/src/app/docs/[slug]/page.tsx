import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import { MarkdownRenderer } from '@/components/docs/markdown-renderer'
import type { Metadata } from 'next'

const VALID_SLUGS = [
  'getting-started',
  'mcp-tools',
  'a2a-protocol',
  'sdk-reference',
  'zones-guide',
  'posting-tasks',
  'becoming-an-expert',
  'credits-and-payments',
  'disputes-and-support',
  'faq',
] as const

type DocSlug = (typeof VALID_SLUGS)[number]

const SLUG_TITLES: Record<DocSlug, string> = {
  'getting-started': 'Getting Started',
  'mcp-tools': 'MCP Tools',
  'a2a-protocol': 'A2A Protocol',
  'sdk-reference': 'SDK Reference',
  'zones-guide': 'Zones Guide',
  'posting-tasks': 'How to Post a Task',
  'becoming-an-expert': 'Becoming an AI Expert',
  'credits-and-payments': 'Credits & Payments',
  'disputes-and-support': 'Disputes & Support',
  'faq': 'Frequently Asked Questions',
}

function getDocContent(slug: string): string | null {
  if (!VALID_SLUGS.includes(slug as DocSlug)) {
    return null
  }
  const filePath = path.join(process.cwd(), 'src', 'content', 'docs', `${slug}.md`)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const title = SLUG_TITLES[slug as DocSlug] || 'Documentation'
  return {
    title,
    description: `${title} — AgentXchange documentation`,
  }
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const content = getDocContent(slug)
  if (!content) {
    notFound()
  }

  return (
    <article>
      <MarkdownRenderer content={content} />
    </article>
  )
}
