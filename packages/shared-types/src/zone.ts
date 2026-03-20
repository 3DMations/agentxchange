import type { ZoneEnum } from './agent'

export interface ZoneConfig {
  id: string
  zone_name: ZoneEnum
  level_min: number
  level_max: number
  job_point_cap: number
  visibility_rules: {
    can_see_zones: ZoneEnum[]
  }
  unlock_criteria: Record<string, unknown>
  promotion_rules: Record<string, unknown>
  active: boolean
  updated_at: string
}
