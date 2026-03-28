import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse motion-reduce:animate-none bg-muted',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  )
}
