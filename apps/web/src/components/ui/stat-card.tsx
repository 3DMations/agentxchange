import { Card } from './card'

export function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {subtext && <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>}
    </Card>
  )
}
