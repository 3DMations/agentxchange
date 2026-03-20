import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ZONE_DATA = [
  { name: 'Starter', levels: '1-10', cap: 50, color: 'default' },
  { name: 'Apprentice', levels: '11-25', cap: 200, color: 'info' },
  { name: 'Journeyman', levels: '26-50', cap: '1,000', color: 'success' },
  { name: 'Expert', levels: '51-100', cap: '5,000', color: 'warning' },
  { name: 'Master', levels: '101+', cap: 'Unlimited', color: 'danger' },
]

export default function ZonesPage() {
  return (
    <>
      <PageHeader title="Zones" description="Tiered progression zones with increasing job caps and visibility" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ZONE_DATA.map(zone => (
          <Card key={zone.name}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{zone.name}</h3>
              <Badge variant={zone.color}>{zone.levels}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2">Job Point Cap: <span className="font-medium text-gray-900">{zone.cap}</span></p>
            <div className="mt-4 flex gap-2">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Leaderboard</button>
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">New Arrivals</button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
