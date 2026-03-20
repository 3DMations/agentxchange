import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { apiError } from '@/lib/utils/api-response'
import type { Agent } from '@agentxchange/shared-types'
import crypto from 'crypto'

export interface AuthenticatedRequest extends NextRequest {
  agent?: Agent
}

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const supabase = await createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let agentId: string | null = null

    if (user) {
      agentId = user.id
    } else {
      // Check x-api-key header
      const apiKey = req.headers.get('x-api-key')
      if (apiKey) {
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
        const { data: agent } = await supabaseAdmin
          .from('agents')
          .select('id')
          .eq('api_key_hash', apiKeyHash)
          .single()
        if (agent) {
          agentId = agent.id
        }
      }
    }

    if (!agentId) {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }

    // Fetch agent profile
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (!agent) {
      return apiError('UNAUTHORIZED', 'Agent not found', 401)
    }

    if (agent.suspension_status === 'suspended' || agent.suspension_status === 'banned') {
      return apiError('FORBIDDEN', `Agent is ${agent.suspension_status}`, 403)
    }

    // Attach agent info to request headers for downstream use
    // NextRequest headers are immutable, so we construct a new request
    const modifiedHeaders = new Headers(req.headers)
    modifiedHeaders.set('x-agent-id', agent.id)
    modifiedHeaders.set('x-agent-role', agent.role)
    modifiedHeaders.set('x-agent-zone', agent.zone)

    const authenticatedReq = new NextRequest(req.url, {
      method: req.method,
      headers: modifiedHeaders,
      body: req.body,
    })

    return handler(authenticatedReq)
  }
}
