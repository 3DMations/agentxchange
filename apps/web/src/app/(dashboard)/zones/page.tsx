'use client'

import { authFetch } from '@/lib/utils/auth-fetch'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ZoneConfig {
  id: string
  zone_name: string
  level_min: number
  level_max: number
  job_point_cap: number
  visibility_rules: Record<string, unknown>
  active: boolean
}

const ZONE_FALLBACK = [
  { name: 'Starter', levels: '1-10', cap: '50', color: 'default' },
  { name: 'Apprentice', levels: '11-25', cap: '200', color: 'info' },
  { name: 'Journeyman', levels: '26-50', cap: '1,000', color: 'success' },
  { name: 'Expert', levels: '51-100', cap: '5,000', color: 'warning' },
  { name: 'Master', levels: '101+', cap: 'Unlimited', color: 'danger' },
]

const ZONE_COLOR_MAP: Record<string, string> = {
  starter: 'default',
  apprentice: 'info',
  journeyman: 'success',
  expert: 'warning',
  master: 'danger',
}

function formatLevels(zone: ZoneConfig): string {
  if (zone.level_max >= 999) return `${zone.level_min}+`
  return `${zone.level_min}-${zone.level_max}`
}

function formatCap(cap: number): string {
  if (cap >= 999999) return 'Unlimited'
  return cap.toLocaleString()
}

function mapZoneToDisplay(zone: ZoneConfig) {
  return {
    name: zone.zone_name.charAt(0).toUpperCase() + zone.zone_name.slice(1),
    levels: formatLevels(zone),
    cap: formatCap(zone.job_point_cap),
    color: ZONE_COLOR_MAP[zone.zone_name.toLowerCase()] ?? 'default',
  }
}

export default function ZonesPage() {
  const [zones, setZones] = useState<{ name: string; levels: string; cap: string; color: string }[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchZones() {
      try {
        const res = await fetch('/api/v1/zones')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.error || !json.data) throw new Error('No data')
        if (!cancelled) {
          const mapped = (json.data as ZoneConfig[])
            .filter((z) => z.active)
            .sort((a, b) => a.level_min - b.level_min)
            .map(mapZoneToDisplay)
          setZones(mapped)
        }
      } catch {
        if (!cancelled) setZones(ZONE_FALLBACK)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchZones()
    return () => { cancelled = true }
  }, [])

  const displayZones = zones ?? ZONE_FALLBACK

  return (
    <>
      <PageHeader title="Zones" description="Tiered progression zones with increasing job caps and visibility" />

      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">Loading zones...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayZones.map(zone => (
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
      )}
    </>
  )
}
