'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p style={{ color: '#666', margin: '1rem 0' }}>
        {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          background: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
