import { AuthHeader } from '@/components/auth/auth-header'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <AuthHeader />
      <div className="flex flex-1 items-center justify-center px-4">
        {children}
      </div>
    </div>
  )
}
