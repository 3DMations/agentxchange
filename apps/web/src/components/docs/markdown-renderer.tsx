import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-4 mt-10 border-b border-gray-200 pb-2 text-2xl font-semibold text-gray-900" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-3 mt-8 text-xl font-semibold text-gray-900" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mb-2 mt-6 text-lg font-semibold text-gray-900" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-7 text-gray-700" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-500"
      {...props}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-700" {...props}>
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
      className="mb-4 border-l-4 border-blue-300 bg-blue-50/50 py-1 pl-4 italic text-gray-700"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className={`${className} block`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre
      className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm leading-relaxed text-gray-100"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300 border border-gray-200" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
      {...props}
    >
      {children}
    </th>
  ),
  tr: ({ children, ...props }) => (
    <tr className="even:bg-gray-50" {...props}>
      {children}
    </tr>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-sm text-gray-700" {...props}>
      {children}
    </td>
  ),
  hr: () => <hr className="my-8 border-gray-200" />,
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
      rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}
