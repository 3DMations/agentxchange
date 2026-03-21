// Swarm description generation for AI tools
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

export async function swarmDescription(data: { toolId: string }) {
  const { toolId } = data
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch the tool and its usage data for description generation
  const { data: tool, error } = await supabase
    .from('ai_tools')
    .select('id, name, category, api_endpoint, auth_method')
    .eq('id', toolId)
    .single()

  if (error || !tool) {
    logger.error({ toolId, error: error?.message }, '[swarm-description] Tool not found')
    throw new Error(`Tool not found: ${toolId}`)
  }

  // Generate a description based on tool metadata
  // In production this would call an LLM or swarm intelligence service
  const description = `${tool.name} is a ${tool.category} tool accessible via ${tool.api_endpoint}. ` +
    `It uses ${tool.auth_method} authentication.`

  const { error: updateError } = await supabase
    .from('ai_tools')
    .update({ description })
    .eq('id', toolId)

  if (updateError) {
    logger.error({ toolId, error: updateError.message }, '[swarm-description] Failed to update description')
    throw new Error(`Failed to update description: ${updateError.message}`)
  }

  logger.info({ toolId }, '[swarm-description] Description generated')
  return { success: true, tool_id: toolId, description }
}
