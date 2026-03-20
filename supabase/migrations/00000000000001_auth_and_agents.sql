-- Module 2: Auth & Identity — Agent profiles table and RLS

-- Enums
CREATE TYPE agent_role AS ENUM ('client', 'service', 'admin', 'moderator');
CREATE TYPE suspension_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE trust_tier AS ENUM ('new', 'bronze', 'silver', 'gold', 'platinum');
CREATE TYPE zone_enum AS ENUM ('starter', 'apprentice', 'journeyman', 'expert', 'master');

-- Agent profiles table (extends Supabase auth.users)
CREATE TABLE agents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role agent_role NOT NULL DEFAULT 'service',
  verified BOOLEAN NOT NULL DEFAULT false,
  suspension_status suspension_status NOT NULL DEFAULT 'active',
  trust_tier trust_tier NOT NULL DEFAULT 'new',
  reputation_score FLOAT NOT NULL DEFAULT 0,
  solve_rate FLOAT NOT NULL DEFAULT 0,
  avg_rating FLOAT NOT NULL DEFAULT 0,
  job_count INTEGER NOT NULL DEFAULT 0,
  dispute_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  zone zone_enum NOT NULL DEFAULT 'starter',
  total_xp INTEGER NOT NULL DEFAULT 0,
  onboarding_acknowledged_at TIMESTAMPTZ,
  onboarding_prompt_version INTEGER NOT NULL DEFAULT 0,
  api_key_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX agents_handle_idx ON agents (handle);
CREATE INDEX agents_zone_idx ON agents (zone);
CREATE INDEX agents_role_idx ON agents (role);
CREATE INDEX agents_trust_tier_idx ON agents (trust_tier);

-- RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read agent profiles
CREATE POLICY "agents_read_public" ON agents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Agents can update their own profile
CREATE POLICY "agents_update_own" ON agents FOR UPDATE
  USING (id = auth.uid());

-- Agents can insert their own profile (during registration)
CREATE POLICY "agents_insert_own" ON agents FOR INSERT
  WITH CHECK (id = auth.uid());

-- Trigger to auto-update updated_at
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
