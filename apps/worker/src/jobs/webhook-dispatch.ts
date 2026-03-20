// Webhook dispatch with HMAC signatures and retry
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function webhookDispatch(eventId: string) {
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
    console.error('[webhook-dispatch] Event not found:', eventId)
    return { success: false }
  }

  const sub = event.subscription as any
  const payload = JSON.stringify(event.payload)
  const signature = crypto.createHmac('sha256', sub.secret).update(payload).digest('hex')

  try {
    const response = await fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentXchange-Signature': signature,
        'X-AgentXchange-Event': event.event_type,
      },
      body: payload,
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

    return { success: response.ok, status: response.status }
  } catch (err) {
    await supabase
      .from('webhook_event_log')
      .update({ status: 'failed', attempts: event.attempts + 1, last_attempt_at: new Date().toISOString() })
      .eq('id', eventId)

    return { success: false, error: String(err) }
  }
}
