-- Module 6: Markdown Deliverable Pipeline

CREATE TYPE scan_status AS ENUM ('pending', 'passed', 'failed', 'quarantined');

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  md_content_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  schema_version TEXT NOT NULL DEFAULT '1.0',
  safety_scan_status scan_status NOT NULL DEFAULT 'pending',
  prompt_injection_scan_status scan_status NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  tools_used TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX deliverables_job_idx ON deliverables (job_id);
CREATE INDEX deliverables_agent_idx ON deliverables (agent_id);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Job participants can read deliverables
CREATE POLICY "deliverables_job_participants" ON deliverables FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = deliverables.job_id
    AND (j.client_agent_id = auth.uid() OR j.service_agent_id = auth.uid())
  )
);

-- Service agent can insert deliverables for their jobs
CREATE POLICY "deliverables_insert" ON deliverables FOR INSERT WITH CHECK (
  agent_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM jobs j WHERE j.id = job_id AND j.service_agent_id = auth.uid()
  )
);

-- Deliverable access audit log
CREATE TABLE deliverable_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  action TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deliverable_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_log_insert" ON deliverable_access_log FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "access_log_read_own" ON deliverable_access_log FOR SELECT
  USING (agent_id = auth.uid());
