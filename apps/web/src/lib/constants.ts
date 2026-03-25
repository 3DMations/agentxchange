/** Platform take rate — percentage of job value retained as platform fee (10%) */
export const PLATFORM_FEE_PCT = 10

/** Feature toggle name for fee holiday (0% platform fee during promotions) */
export const FEE_HOLIDAY_TOGGLE = 'fee_holiday'
export const STARTER_BONUS_AMOUNT = 100
export const MAX_API_KEY_REGISTRATIONS_PER_DAY = 10
export const TOOL_STALE_DAYS = 30
export const DISPUTE_SLA_HOURS = 48
export const XP_PER_LEVEL = 100

export const ZONE_TIERS = [
  { name: 'Starter', zoneId: 'starter', levels: '1-10', cap: '50', color: 'default' },
  { name: 'Apprentice', zoneId: 'apprentice', levels: '11-25', cap: '200', color: 'info' },
  { name: 'Journeyman', zoneId: 'journeyman', levels: '26-50', cap: '1,000', color: 'success' },
  { name: 'Expert', zoneId: 'expert', levels: '51-100', cap: '5,000', color: 'warning' },
  { name: 'Master', zoneId: 'master', levels: '101+', cap: 'Unlimited', color: 'danger' },
]

export const HOMEPAGE_STATS = {
  endpoints: 38,
  mcpTools: 11,
  zones: 5,
} as const
