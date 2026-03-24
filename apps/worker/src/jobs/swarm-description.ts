// Swarm description generation for AI tools using Claude API
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

const SWARM_MODEL = process.env.SWARM_DESCRIPTION_MODEL || 'claude-sonnet-4-20250514'
const SWARM_MAX_TOKENS = parseInt(process.env.SWARM_DESCRIPTION_MAX_TOKENS || '1024', 10)
const SWARM_TIMEOUT_MS = parseInt(process.env.SWARM_DESCRIPTION_TIMEOUT_MS || '30000', 10)

interface ToolMetadata {
  id: string
  name: string
  category: string
  api_endpoint: string | null
  auth_method: string | null
  provider: string | null
  version: string | null
  url: string | null
  capabilities: string[] | null
  input_formats: string[] | null
  output_formats: string[] | null
  known_limitations: string[] | null
  pricing_model: string | null
  description_short: string | null
}

export function buildPrompt(tool: ToolMetadata): string {
  const parts = [
    `Write a concise 2-4 paragraph catalog description for the following AI tool.`,
    `Focus on what it does, its strengths, typical use cases, and any notable limitations.`,
    `Write in third person, professional tone. Do not use marketing language.`,
    ``,
    `Tool Name: ${tool.name}`,
    `Category: ${tool.category}`,
  ]

  if (tool.description_short) parts.push(`Short Description: ${tool.description_short}`)
  if (tool.provider) parts.push(`Provider: ${tool.provider}`)
  if (tool.version) parts.push(`Version: ${tool.version}`)
  if (tool.api_endpoint) parts.push(`API Endpoint: ${tool.api_endpoint}`)
  if (tool.auth_method) parts.push(`Auth Method: ${tool.auth_method}`)
  if (tool.capabilities?.length) parts.push(`Capabilities: ${tool.capabilities.join(', ')}`)
  if (tool.input_formats?.length) parts.push(`Input Formats: ${tool.input_formats.join(', ')}`)
  if (tool.output_formats?.length) parts.push(`Output Formats: ${tool.output_formats.join(', ')}`)
  if (tool.known_limitations?.length) parts.push(`Known Limitations: ${tool.known_limitations.join(', ')}`)
  if (tool.pricing_model) parts.push(`Pricing Model: ${tool.pricing_model}`)

  return parts.join('\n')
}

export function generateFallbackDescription(tool: ToolMetadata): string {
  const parts = [`${tool.name} is a ${tool.category} tool`]

  if (tool.description_short) {
    parts[0] += ` — ${tool.description_short}`
  }

  if (tool.provider) parts.push(`Provided by ${tool.provider}.`)
  if (tool.api_endpoint) parts.push(`Accessible via ${tool.api_endpoint}.`)
  if (tool.auth_method) parts.push(`Uses ${tool.auth_method} authentication.`)
  if (tool.capabilities?.length) parts.push(`Capabilities: ${tool.capabilities.join(', ')}.`)
  if (tool.input_formats?.length) parts.push(`Accepts: ${tool.input_formats.join(', ')}.`)
  if (tool.output_formats?.length) parts.push(`Outputs: ${tool.output_formats.join(', ')}.`)

  return parts.join(' ')
}

async function generateWithLLM(tool: ToolMetadata): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    logger.warn({ toolId: tool.id }, '[swarm-description] ANTHROPIC_API_KEY not set — using fallback')
    return null
  }

  if (process.env.SWARM_DESCRIPTION_LLM_ENABLED === 'false') {
    logger.info({ toolId: tool.id }, '[swarm-description] LLM generation disabled — using fallback')
    return null
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({
      apiKey,
      timeout: SWARM_TIMEOUT_MS,
      maxRetries: 2,
    })

    const response = await client.messages.create({
      model: SWARM_MODEL,
      max_tokens: SWARM_MAX_TOKENS,
      messages: [{ role: 'user', content: buildPrompt(tool) }],
    })

    const textBlock = response.content.find((b: { type: string }) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      logger.warn({ toolId: tool.id }, '[swarm-description] No text in LLM response')
      return null
    }

    return textBlock.text
  } catch (err) {
    logger.error({ toolId: tool.id, error: err instanceof Error ? err.message : String(err) }, '[swarm-description] LLM call failed — using fallback')
    return null
  }
}

export async function swarmDescription(data: { toolId: string }) {
  const { toolId } = data
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch richer metadata for better description generation
  const { data: tool, error } = await supabase
    .from('ai_tools')
    .select('id, name, category, api_endpoint, auth_method, provider, version, url, capabilities, input_formats, output_formats, known_limitations, pricing_model, description_short')
    .eq('id', toolId)
    .single()

  if (error || !tool) {
    logger.error({ toolId, error: error?.message }, '[swarm-description] Tool not found')
    throw new Error(`Tool not found: ${toolId}`)
  }

  // Try LLM generation, fall back to template
  const llmDescription = await generateWithLLM(tool as ToolMetadata)
  const description = llmDescription || generateFallbackDescription(tool as ToolMetadata)
  const confidenceScore = llmDescription ? 0.85 : 0.3

  const { error: updateError } = await supabase
    .from('ai_tools')
    .update({ description, swarm_confidence_score: confidenceScore })
    .eq('id', toolId)

  if (updateError) {
    logger.error({ toolId, error: updateError.message }, '[swarm-description] Failed to update description')
    throw new Error(`Failed to update description: ${updateError.message}`)
  }

  logger.info({ toolId, usedLLM: !!llmDescription, confidenceScore }, '[swarm-description] Description generated')
  return { success: true, tool_id: toolId, description, confidence_score: confidenceScore }
}
