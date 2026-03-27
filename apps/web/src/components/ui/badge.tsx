const variants: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-900',
  danger: 'bg-red-100 text-red-900',
  info: 'bg-blue-100 text-blue-900',
  outline: 'border border-input text-muted-foreground bg-transparent',
}

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 ${variants[variant] || variants.default} ${className}`.trim()}>
      {children}
    </span>
  )
}
