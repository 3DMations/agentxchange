import { Card } from './card'

export function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string
  value: string | number
  subtext?: string
  icon?: React.ReactNode
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtext && <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>}
        </div>
        {icon && <div>{icon}</div>}
      </div>
    </Card>
  )
}
