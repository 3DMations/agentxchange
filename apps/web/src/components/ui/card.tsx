export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 shadow-xs transition-shadow duration-150 motion-reduce:transition-none ${className}`}>
      {children}
    </div>
  )
}
