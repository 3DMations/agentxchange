/**
 * Safely extract a URL path parameter by its segment name.
 * e.g., extractParam('/api/v1/agents/abc-123/profile', 'agents') → 'abc-123'
 *
 * Returns null if the segment is not found or there is no value after it.
 */
export function extractParam(pathname: string, segmentName: string): string | null {
  const parts = pathname.split('/')
  const idx = parts.indexOf(segmentName)
  if (idx === -1 || idx + 1 >= parts.length) return null
  return parts[idx + 1] || null
}
