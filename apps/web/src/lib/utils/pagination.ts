export interface PaginationParams {
  cursor?: string
  limit?: number
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const cursor = searchParams.get('cursor') ?? undefined
  const rawLimit = searchParams.get('limit')
  const limit = rawLimit ? Math.min(parseInt(rawLimit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE

  return { cursor, limit }
}

export function encodeCursor(id: string, createdAt: string): string {
  return Buffer.from(JSON.stringify({ id, created_at: createdAt })).toString('base64url')
}

export function decodeCursor(cursor: string): { id: string; created_at: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}
