-- Module 8: Reputation Engine

CREATE TYPE confidence_tier AS ENUM ('unrated', 'low', 'medium', 'high', 'very_high');

CREATE TABLE reputation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID UNIQUE NOT NULL REFERENCES agents(id),
  score FLOAT NOT NULL DEFAULT 0,
  confidence_tier confidence_tier NOT NULL DEFAULT 'unrated',
  weighted_avg_rating FLOAT NOT NULL DEFAULT 0,
  solve_rate FLOAT NOT NULL DEFAULT 0,
  recency_decay FLOAT NOT NULL DEFAULT 1.0,
  dispute_rate FLOAT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reputation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reputation_read" ON reputation_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

-- PostgreSQL function for atomic reputation recalculation
CREATE OR REPLACE FUNCTION recalculate_reputation(p_agent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jobs RECORD;
  v_score FLOAT;
  v_confidence confidence_tier;
  v_weighted_avg FLOAT;
  v_solve_rate FLOAT;
  v_dispute_rate FLOAT;
  v_job_count INTEGER;
  v_dispute_count INTEGER;
BEGIN
  -- Aggregate from completed jobs
  SELECT
    COUNT(*) as total,
    COALESCE(AVG(helpfulness_score), 0) as avg_rating,
    COALESCE(SUM(CASE WHEN solved THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0), 0) as solve_rate
  INTO v_jobs
  FROM jobs
  WHERE service_agent_id = p_agent_id AND status = 'completed';

  v_job_count := v_jobs.total;
  v_weighted_avg := v_jobs.avg_rating;
  v_solve_rate := v_jobs.solve_rate;

  -- Dispute rate
  SELECT COUNT(*) INTO v_dispute_count
  FROM jobs
  WHERE service_agent_id = p_agent_id AND status = 'disputed';

  v_dispute_rate := CASE
    WHEN v_job_count + v_dispute_count > 0
    THEN v_dispute_count::FLOAT / (v_job_count + v_dispute_count)
    ELSE 0
  END;

  -- Confidence tier
  v_confidence := CASE
    WHEN v_job_count < 5 THEN 'unrated'
    WHEN v_job_count < 16 THEN 'low'
    WHEN v_job_count < 31 THEN 'medium'
    WHEN v_job_count < 76 THEN 'high'
    ELSE 'very_high'
  END;

  -- Composite score
  v_score := (v_weighted_avg * 0.4) + (v_solve_rate * 0.3) +
             (LEAST(v_job_count::FLOAT / 100, 1.0) * 0.2) +
             ((1.0 - v_dispute_rate) * 0.1);

  -- Upsert reputation snapshot
  INSERT INTO reputation_snapshots (agent_id, score, confidence_tier, weighted_avg_rating, solve_rate, dispute_rate, last_updated)
  VALUES (p_agent_id, v_score, v_confidence, v_weighted_avg, v_solve_rate, v_dispute_rate, now())
  ON CONFLICT (agent_id) DO UPDATE SET
    score = EXCLUDED.score,
    confidence_tier = EXCLUDED.confidence_tier,
    weighted_avg_rating = EXCLUDED.weighted_avg_rating,
    solve_rate = EXCLUDED.solve_rate,
    dispute_rate = EXCLUDED.dispute_rate,
    last_updated = now();

  -- Update denormalized fields on agents
  UPDATE agents SET
    reputation_score = v_score,
    avg_rating = v_weighted_avg,
    solve_rate = v_solve_rate,
    job_count = v_job_count
  WHERE id = p_agent_id;

  RETURN jsonb_build_object('score', v_score, 'confidence', v_confidence, 'job_count', v_job_count);
END;
$$;
