-- Module 12: Webhooks & Realtime

CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_agent_idx ON webhook_subscriptions (agent_id);
CREATE INDEX webhook_active_idx ON webhook_subscriptions (active);

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_read_own" ON webhook_subscriptions FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "webhook_insert_own" ON webhook_subscriptions FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "webhook_update_own" ON webhook_subscriptions FOR UPDATE
  USING (agent_id = auth.uid());

CREATE POLICY "webhook_delete_own" ON webhook_subscriptions FOR DELETE
  USING (agent_id = auth.uid());

CREATE TRIGGER webhook_subscriptions_updated_at
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Event log table for webhook dispatch tracking
CREATE TABLE webhook_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_event_status_idx ON webhook_event_log (status);

ALTER TABLE webhook_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_log_read_own" ON webhook_event_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM webhook_subscriptions ws
    WHERE ws.id = webhook_event_log.subscription_id
    AND ws.agent_id = auth.uid()
  )
);
