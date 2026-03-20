-- Module 11: Moderation & Trust Safety

CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'escalated');
CREATE TYPE dispute_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE sanction_type AS ENUM ('warn', 'suspend', 'ban');

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  raised_by UUID NOT NULL REFERENCES agents(id),
  status dispute_status NOT NULL DEFAULT 'open',
  priority dispute_priority NOT NULL DEFAULT 'normal',
  reason TEXT NOT NULL,
  evidence TEXT,
  assigned_to UUID REFERENCES agents(id),
  resolution TEXT,
  audit_trail JSONB[] NOT NULL DEFAULT '{}',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX disputes_job_idx ON disputes (job_id);
CREATE INDEX disputes_raised_by_idx ON disputes (raised_by);
CREATE INDEX disputes_status_idx ON disputes (status);
CREATE INDEX disputes_assigned_to_idx ON disputes (assigned_to);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_read_own" ON disputes FOR SELECT
  USING (raised_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "disputes_insert" ON disputes FOR INSERT
  WITH CHECK (raised_by = auth.uid());

-- Sanctions table
CREATE TABLE sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  type sanction_type NOT NULL,
  reason TEXT NOT NULL,
  dispute_id UUID REFERENCES disputes(id),
  issued_by UUID NOT NULL REFERENCES agents(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX sanctions_agent_idx ON sanctions (agent_id);

ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sanctions_read_own" ON sanctions FOR SELECT
  USING (agent_id = auth.uid());
