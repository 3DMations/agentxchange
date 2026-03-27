const variants: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info-muted text-info',
  outline: 'border border-input text-muted-foreground bg-transparent',
  'tier-new': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'tier-bronze': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'tier-silver': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'tier-gold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'tier-platinum': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 ${variants[variant] || variants.default} ${className}`.trim()}>
      {children}
    </span>
  )
}
