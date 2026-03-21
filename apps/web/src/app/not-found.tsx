import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Page Not Found</h2>
      <p style={{ color: '#666', margin: '1rem 0' }}>
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        style={{ color: '#0070f3', textDecoration: 'underline' }}
      >
        Return home
      </Link>
    </div>
  )
}
