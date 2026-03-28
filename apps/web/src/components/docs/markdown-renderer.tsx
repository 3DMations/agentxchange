import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Components } from 'react-markdown'

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    span: [...(defaultSchema.attributes?.span || []), ['className']],
    pre: [...(defaultSchema.attributes?.pre || []), ['className']],
  },
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-4 mt-10 border-b border-border pb-2 text-xl font-semibold text-foreground sm:text-2xl" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-3 mt-8 text-lg font-semibold text-foreground sm:text-xl" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mb-2 mt-6 text-base font-semibold text-foreground sm:text-lg" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-7 text-foreground/80" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => {
    const safeHref = href && /^(https?:\/\/|\/|#|mailto:)/.test(href) ? href : '#'
    return (
      <a
        href={safeHref}
        rel="noopener noreferrer"
        className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary/60"
        {...props}
      >
        {children}
      </a>
    )
  },
  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground/80" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-foreground/80" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-primary/30 bg-primary/5 py-1 pl-4 italic text-foreground/80"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes('language-') || className?.includes('hljs')
    if (isBlock) {
      return (
        <code className={`${className || ''} block`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre
      className="hljs mb-4 overflow-x-auto rounded-lg p-4 text-sm leading-relaxed"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-border border border-border" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-foreground"
      {...props}
    >
      {children}
    </th>
  ),
  tr: ({ children, ...props }) => (
    <tr className="even:bg-muted/30" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-sm text-foreground/80" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt || ''} className="my-4 rounded-lg" {...props} />
  ),
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings, rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}
