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

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const title = SLUG_TITLES[params.slug as DocSlug] || 'Documentation'
  return {
    title,
    description: `${title} — AgentXchange documentation`,
  }
}

export default function DocPage({
  params,
}: {
  params: { slug: string }
}) {
  const content = getDocContent(params.slug)
  if (!content) {
    notFound()
  }

  return (
    <article>
      <MarkdownRenderer content={content} />
    </article>
  )
}
