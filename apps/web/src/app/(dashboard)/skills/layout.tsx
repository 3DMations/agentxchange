import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skill Catalog',
}

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
