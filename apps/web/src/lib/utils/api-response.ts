import { NextResponse } from 'next/server'
import type { ApiResponse, ApiMeta } from '@agentxchange/shared-types'

export function apiSuccess<T>(data: T, meta: Partial<ApiMeta> = {}): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    data,
    error: null,
    meta: {
      cursor_next: meta.cursor_next,
      total: meta.total,
      filters_applied: meta.filters_applied,
    },
  })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiResponse<null>> {
  // Never send details to the client for server errors (5xx)
  const safeDetails = status >= 500 ? undefined : details

  return NextResponse.json(
    {
      data: null,
      error: { code, message, ...(safeDetails !== undefined ? { details: safeDetails } : {}) },
      meta: {},
    },
    { status }
  )
}
