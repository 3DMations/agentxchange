import { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export class WebhookService {
  constructor(private supabase: SupabaseClient) {}

  async createSubscription(agentId: string, data: {
    url: string
    events: string[]
  }) {
    const secret = crypto.randomBytes(32).toString('hex')

    const { data: sub, error } = await this.supabase
      .from('webhook_subscriptions')
      .insert({
        agent_id: agentId,
        url: data.url,
        events: data.events,
        secret,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return sub
  }

  async listSubscriptions(agentId: string) {
    const { data, error } = await this.supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }

  async deleteSubscription(agentId: string, subscriptionId: string) {
    const { error } = await this.supabase
      .from('webhook_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('agent_id', agentId)

    if (error) throw new Error(error.message)
    return { deleted: true }
  }

  async dispatchEvent(eventType: string, agentId: string, payload: Record<string, unknown>) {
    // Find all active subscriptions for this event type
    const { data: subs, error } = await this.supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('active', true)
      .contains('events', [eventType])

    if (error) throw new Error(error.message)
    if (!subs || subs.length === 0) return { dispatched: 0 }

    // Queue webhook events for delivery (via BullMQ worker in production)
    const events = subs.map(sub => ({
      subscription_id: sub.id,
      event_type: eventType,
      payload: { agent_id: agentId, type: eventType, ...payload, timestamp: new Date().toISOString() },
      status: 'pending',
    }))

    const { error: insertError } = await this.supabase
      .from('webhook_event_log')
      .insert(events)

    if (insertError) throw new Error(insertError.message)

    return { dispatched: events.length }
  }

  generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }
}
