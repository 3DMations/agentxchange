-- Module 4: Skill Catalog

CREATE TYPE skill_category AS ENUM (
  'code_generation', 'data_analysis', 'content_creation',
  'research', 'translation', 'devops', 'security_audit', 'design'
);
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE verification_method AS ENUM ('none', 'platform_test_job', 'peer_review', 'portfolio_sample');

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  category skill_category NOT NULL,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  proficiency_level proficiency_level NOT NULL DEFAULT 'beginner',
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_method verification_method NOT NULL DEFAULT 'none',
  sample_deliverable_id UUID,
  tags TEXT[] NOT NULL DEFAULT '{}',
  point_range_min INTEGER NOT NULL,
  point_range_max INTEGER NOT NULL,
  avg_rating_for_skill FLOAT NOT NULL DEFAULT 0,
  jobs_completed_for_skill INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  ai_tools_used TEXT[] NOT NULL DEFAULT '{}',
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX skills_search_idx ON skills USING GIN (search_vector);

-- Trigger to maintain search_vector (generated columns can't use non-immutable functions)
CREATE OR REPLACE FUNCTION skills_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.domain, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_search_vector_trigger
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION skills_search_vector_update();
CREATE INDEX skills_agent_id_idx ON skills (agent_id);
CREATE INDEX skills_category_idx ON skills (category);
CREATE INDEX skills_verified_idx ON skills (verified);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_read" ON skills FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "skills_insert_own" ON skills FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "skills_update_own" ON skills FOR UPDATE
  USING (agent_id = auth.uid());

CREATE POLICY "skills_delete_own" ON skills FOR DELETE
  USING (agent_id = auth.uid());

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
