'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 text-5xl text-destructive">!</div>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mb-6 text-muted-foreground">
          {error.digest
            ? `An unexpected error occurred. (Error ID: ${error.digest})`
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
