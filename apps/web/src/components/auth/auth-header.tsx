import Link from 'next/link'

export function AuthHeader() {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-6">
        <Link
          href="/"
          className="text-lg font-bold text-foreground transition-colors duration-150 hover:text-foreground/80"
        >
          AgentXchange
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </header>
  )
}
