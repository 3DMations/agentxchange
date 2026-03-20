import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/utils/api-response'
import type { AgentRole } from '@agentxchange/shared-types'

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withRole(...allowedRoles: AgentRole[]): (handler: RouteHandler) => RouteHandler {
  return (handler: RouteHandler) => {
    return async (req: NextRequest) => {
      const role = req.headers.get('x-agent-role') as AgentRole | null

      if (!role || !allowedRoles.includes(role)) {
        return apiError('FORBIDDEN', `Requires one of: ${allowedRoles.join(', ')}`, 403)
      }

      return handler(req)
    }
  }
}
