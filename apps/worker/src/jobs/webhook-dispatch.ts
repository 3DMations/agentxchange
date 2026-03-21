// Webhook dispatch with HMAC signatures and retry
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { logger } from '../logger.js'

/** Timeout for webhook HTTP requests (10 seconds) */
const WEBHOOK_TIMEOUT_MS = 10_000

export async function webhookDispatch(data: { eventId: string }) {
  const { eventId } = data
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: event, error } = await supabase
    .from('webhook_event_log')
    .select('*, subscription:webhook_subscriptions(*)')
    .eq('id', eventId)
    .single()

  if (error || !event) {
    logger.error({ eventId, error: error?.message }, '[webhook-dispatch] Event not found')
    throw new Error(`Event not found: ${eventId}`)
  }

  const sub = event.subscription as any
  if (!sub || !sub.url || !sub.secret) {
    logger.error({ eventId }, '[webhook-dispatch] Subscription missing url or secret')
    throw new Error(`Invalid subscription for event: ${eventId}`)
  }

  const payload = JSON.stringify(event.payload)
  const timestamp = Math.floor(Date.now() / 1000)
  const signaturePayload = `${timestamp}.${payload}`
  const signature = crypto.createHmac('sha256', sub.secret).update(signaturePayload).digest('hex')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    const response = await fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentXchange-Signature': `t=${timestamp},v1=${signature}`,
        'X-AgentXchange-Event': event.event_type,
        'X-AgentXchange-Delivery': eventId,
      },
      body: payload,
      signal: controller.signal,
    })

    await supabase
      .from('webhook_event_log')
      .update({
        status: response.ok ? 'delivered' : 'failed',
        attempts: event.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        ...(response.ok ? { delivered_at: new Date().toISOString() } : {}),
      })
      .eq('id', eventId)

    if (!response.ok) {
      logger.warn({ eventId, status: response.status }, '[webhook-dispatch] Non-OK response')
      throw new Error(`Webhook returned ${response.status}`)
    }

    logger.info({ eventId, status: response.status }, '[webhook-dispatch] Delivered')
    return { success: true, status: response.status }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await supabase
      .from('webhook_event_log')
      .update({
        status: 'failed',
        attempts: event.attempts + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', eventId)

    logger.error({ eventId, error: errorMessage }, '[webhook-dispatch] Failed')
    throw err // Re-throw so BullMQ can retry
  } finally {
    clearTimeout(timeout)
  }
}
