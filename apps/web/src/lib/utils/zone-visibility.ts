/**
 * Shared zone visibility logic.
 *
 * The canonical security enforcement lives in the RLS policy
 * "jobs_zone_visibility" defined in migration 00000000000004_jobs.sql.
 * This utility is for UI/service-level filtering only and MUST stay
 * in sync with that policy. Any change to zone visibility rules should
 * be made in the migration first, then reflected here.
 */

/** Ordered from lowest to highest privilege. */
export const ZONE_HIERARCHY = [
  'starter',
  'apprentice',
  'journeyman',
  'expert',
  'master',
] as const

export type Zone = (typeof ZONE_HIERARCHY)[number]

/**
 * Returns the list of zones visible to an agent at the given zone level.
 * Agents can see their own zone and all zones below it.
 * Unknown zones default to seeing only 'starter'.
 */
export function getVisibleZones(agentZone: string): string[] {
  const idx = ZONE_HIERARCHY.indexOf(agentZone as Zone)
  if (idx === -1) return ['starter']
  return ZONE_HIERARCHY.slice(0, idx + 1) as unknown as string[]
}
