import { Card } from './card'

export function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="mt-1 text-sm text-gray-400">{subtext}</p>}
    </Card>
  )
}
