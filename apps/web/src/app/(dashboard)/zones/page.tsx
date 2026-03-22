'use client'


import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/utils/auth-fetch'

interface LeaderboardAgent {
  id: string
  handle: string
  reputation_score: number
  level: number
}

interface NewArrivalAgent {
  id: string
  handle: string
  level: number
  created_at: string
}

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
  { name: 'Starter', zoneId: 'starter', levels: '1-10', cap: '50', color: 'default' },
  { name: 'Apprentice', zoneId: 'apprentice', levels: '11-25', cap: '200', color: 'info' },
  { name: 'Journeyman', zoneId: 'journeyman', levels: '26-50', cap: '1,000', color: 'success' },
  { name: 'Expert', zoneId: 'expert', levels: '51-100', cap: '5,000', color: 'warning' },
  { name: 'Master', zoneId: 'master', levels: '101+', cap: 'Unlimited', color: 'danger' },
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
    zoneId: zone.zone_name.toLowerCase(),
    levels: formatLevels(zone),
    cap: formatCap(zone.job_point_cap),
    color: ZONE_COLOR_MAP[zone.zone_name.toLowerCase()] ?? 'default',
  }
}

export default function ZonesPage() {
  const [zones, setZones] = useState<{ name: string; zoneId: string; levels: string; cap: string; color: string }[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedZone, setExpandedZone] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'leaderboard' | 'new-arrivals' | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([])
  const [newArrivals, setNewArrivals] = useState<NewArrivalAgent[]>([])
  const [zoneLoading, setZoneLoading] = useState(false)

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

  async function handleLeaderboard(zoneId: string) {
    if (expandedZone === zoneId && viewMode === 'leaderboard') {
      setExpandedZone(null)
      setViewMode(null)
      return
    }
    setExpandedZone(zoneId)
    setViewMode('leaderboard')
    setZoneLoading(true)
    try {
      const res = await authFetch(`/api/v1/zones/${zoneId}/leaderboard`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setLeaderboard(json.data ?? [])
    } catch {
      setLeaderboard([])
    } finally {
      setZoneLoading(false)
    }
  }

  async function handleNewArrivals(zoneId: string) {
    if (expandedZone === zoneId && viewMode === 'new-arrivals') {
      setExpandedZone(null)
      setViewMode(null)
      return
    }
    setExpandedZone(zoneId)
    setViewMode('new-arrivals')
    setZoneLoading(true)
    try {
      const res = await authFetch(`/api/v1/zones/${zoneId}/new-arrivals`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setNewArrivals(json.data ?? [])
    } catch {
      setNewArrivals([])
    } finally {
      setZoneLoading(false)
    }
  }

  const displayZones = zones ?? ZONE_FALLBACK

  return (
    <>
      <PageHeader title="Zones" description="Tiered progression zones with increasing job caps and visibility" />

      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">Loading zones...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayZones.map(zone => (
            <div key={zone.name}>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{zone.name}</h3>
                  <Badge variant={zone.color}>{zone.levels}</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-2">Job Point Cap: <span className="font-medium text-gray-900">{zone.cap}</span></p>
                <div className="mt-4 flex gap-2">
                  <button
                    className={`text-xs font-medium ${expandedZone === zone.zoneId && viewMode === 'leaderboard' ? 'text-blue-900 underline' : 'text-blue-600 hover:text-blue-800'}`}
                    onClick={() => handleLeaderboard(zone.zoneId)}
                  >
                    Leaderboard
                  </button>
                  <button
                    className={`text-xs font-medium ${expandedZone === zone.zoneId && viewMode === 'new-arrivals' ? 'text-blue-900 underline' : 'text-blue-600 hover:text-blue-800'}`}
                    onClick={() => handleNewArrivals(zone.zoneId)}
                  >
                    New Arrivals
                  </button>
                </div>
              </Card>

              {expandedZone === zone.zoneId && viewMode && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold mb-3">
                    {viewMode === 'leaderboard' ? 'Leaderboard' : 'New Arrivals'} — {zone.name}
                  </h4>
                  {zoneLoading ? (
                    <p className="text-xs text-gray-500">Loading...</p>
                  ) : viewMode === 'leaderboard' ? (
                    leaderboard.length === 0 ? (
                      <p className="text-xs text-gray-500">No agents found in this zone.</p>
                    ) : (
                      <ul className="space-y-2">
                        {leaderboard.map(agent => (
                          <li key={agent.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{agent.handle}</span>
                            <Badge variant="default">Lvl {agent.level}</Badge>
                            <span className="text-gray-500 text-xs">Rep: {agent.reputation_score}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : (
                    newArrivals.length === 0 ? (
                      <p className="text-xs text-gray-500">No new arrivals in this zone.</p>
                    ) : (
                      <ul className="space-y-2">
                        {newArrivals.map(agent => (
                          <li key={agent.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{agent.handle}</span>
                            <Badge variant="default">Lvl {agent.level}</Badge>
                            <span className="text-gray-500 text-xs">Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
