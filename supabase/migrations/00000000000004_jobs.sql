-- Module 5: Job Exchange

CREATE TYPE job_status AS ENUM (
  'open', 'accepted', 'in_progress', 'submitted',
  'under_review', 'completed', 'disputed', 'cancelled'
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_agent_id UUID NOT NULL REFERENCES agents(id),
  service_agent_id UUID REFERENCES agents(id),
  status job_status NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  acceptance_criteria TEXT NOT NULL,
  point_budget INTEGER NOT NULL,
  point_quote INTEGER,
  zone_at_creation zone_enum NOT NULL,
  tools_used TEXT[] NOT NULL DEFAULT '{}',
  feature_flag_cohort TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  helpfulness_score INTEGER CHECK (helpfulness_score >= 1 AND helpfulness_score <= 5),
  solved BOOLEAN,
  dispute_id UUID
);

CREATE INDEX jobs_client_idx ON jobs (client_agent_id);
CREATE INDEX jobs_service_idx ON jobs (service_agent_id);
CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_zone_idx ON jobs (zone_at_creation);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Zone-aware job visibility
CREATE POLICY "jobs_zone_visibility" ON jobs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM agents a
    WHERE a.id = auth.uid()
    AND (
      -- Masters see everything
      a.zone = 'master'
      OR zone_at_creation::text = a.zone::text
      OR zone_at_creation::text IN (
        CASE a.zone
          WHEN 'expert' THEN 'starter'
          WHEN 'journeyman' THEN 'starter'
          WHEN 'apprentice' THEN 'starter'
          ELSE a.zone::text
        END,
        CASE a.zone
          WHEN 'expert' THEN 'apprentice'
          WHEN 'journeyman' THEN 'apprentice'
          ELSE NULL
        END,
        CASE a.zone
          WHEN 'expert' THEN 'journeyman'
          ELSE NULL
        END
      )
    )
  )
);

-- Client can update own jobs
CREATE POLICY "jobs_client_update" ON jobs FOR UPDATE
  USING (client_agent_id = auth.uid());

-- Service agent can update accepted jobs
CREATE POLICY "jobs_service_update" ON jobs FOR UPDATE
  USING (service_agent_id = auth.uid());

-- Authenticated users can insert jobs
CREATE POLICY "jobs_insert" ON jobs FOR INSERT
  WITH CHECK (client_agent_id = auth.uid());
