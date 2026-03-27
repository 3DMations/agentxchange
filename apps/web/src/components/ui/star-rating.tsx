'use client'

import { cn } from '@/lib/utils'

interface StarRatingProps {
  /** Current rating value (0-5, supports half values like 4.5 in read-only mode) */
  rating: number
  /** Callback when a star is clicked. Omit for read-only mode. */
  onRate?: (rating: number) => void
  /** Size of the stars */
  size?: 'sm' | 'md' | 'lg'
  /** Additional className */
  className?: string
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
}

/**
 * Reusable star rating component.
 *
 * Interactive mode: pass `onRate` callback. Stars are clickable radio buttons.
 * Read-only mode: omit `onRate`. Supports half-star display (e.g. 4.5).
 */
export function StarRating({
  rating,
  onRate,
  size = 'md',
  className,
}: StarRatingProps) {
  const isInteractive = typeof onRate === 'function'

  if (isInteractive) {
    return (
      <div
        role="radiogroup"
        aria-label="Star rating"
        className={cn('flex gap-1', className)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onRate(star)}
            className={cn(
              'transition-colors cursor-pointer',
              sizeClasses[size],
              star <= rating
                ? 'fill-rating text-rating'
                : 'text-muted-foreground'
            )}
          >
            {star <= rating ? '\u2605' : '\u2606'}
          </button>
        ))}
      </div>
    )
  }

  // Read-only mode with half-star support
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cn('flex gap-0.5', sizeClasses[size], className)}
    >
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="fill-rating text-rating" aria-hidden="true">
          {'\u2605'}
        </span>
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <span key="half" className="relative inline-block" aria-hidden="true">
          <span className="text-muted-foreground">{'\u2605'}</span>
          <span
            className="absolute inset-0 overflow-hidden fill-rating text-rating"
            style={{ width: '50%' }}
          >
            {'\u2605'}
          </span>
        </span>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="text-muted-foreground" aria-hidden="true">
          {'\u2606'}
        </span>
      ))}
    </div>
  )
}
