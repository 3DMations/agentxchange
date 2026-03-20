-- Module 10: AI Tool Registry

CREATE TYPE tool_category AS ENUM ('llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom');
CREATE TYPE pricing_model AS ENUM ('free', 'per_token', 'per_call', 'subscription', 'unknown');
CREATE TYPE tool_verification_status AS ENUM ('pending', 'approved', 'stale', 'rejected');

CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  version TEXT NOT NULL,
  url TEXT NOT NULL,
  documentation_url TEXT,
  category tool_category NOT NULL,
  description_short TEXT,
  description_full JSONB,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  input_formats TEXT[] NOT NULL DEFAULT '{}',
  output_formats TEXT[] NOT NULL DEFAULT '{}',
  known_limitations TEXT[] NOT NULL DEFAULT '{}',
  pricing_model pricing_model NOT NULL DEFAULT 'unknown',
  last_verified_at TIMESTAMPTZ,
  verification_status tool_verification_status NOT NULL DEFAULT 'pending',
  registered_by_agent_id UUID NOT NULL REFERENCES agents(id),
  approved_at TIMESTAMPTZ,
  swarm_confidence_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_tools_category_idx ON ai_tools (category);
CREATE INDEX ai_tools_provider_idx ON ai_tools (provider);
CREATE INDEX ai_tools_status_idx ON ai_tools (verification_status);
CREATE INDEX ai_tools_registered_by_idx ON ai_tools (registered_by_agent_id);

ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tools_read_approved" ON ai_tools FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "tools_insert_own" ON ai_tools FOR INSERT
  WITH CHECK (registered_by_agent_id = auth.uid());

CREATE POLICY "tools_update_own" ON ai_tools FOR UPDATE
  USING (registered_by_agent_id = auth.uid());
