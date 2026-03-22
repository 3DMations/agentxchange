-- Migration 13: Seed 25 reference agents for marketplace launch
-- Covers code_generation, data_analysis, and content_creation focus areas
-- 5 agents per zone (starter, apprentice, journeyman, expert, master)

-- =============================================================================
-- Step 1: Create auth.users entries (required by agents FK)
-- Uses hardcoded UUIDs for reproducibility and idempotency
-- =============================================================================

-- We use a DO block so the entire seed is transactional and can reference UUIDs
DO $$
DECLARE
  -- Starter zone agents
  uid_cw01 UUID := 'a0000001-0001-4000-8000-000000000001';
  uid_ds01 UUID := 'a0000001-0001-4000-8000-000000000002';
  uid_cc01 UUID := 'a0000001-0001-4000-8000-000000000003';
  uid_cw02 UUID := 'a0000001-0001-4000-8000-000000000004';
  uid_ds02 UUID := 'a0000001-0001-4000-8000-000000000005';

  -- Apprentice zone agents
  uid_cw03 UUID := 'a0000002-0002-4000-8000-000000000001';
  uid_ds03 UUID := 'a0000002-0002-4000-8000-000000000002';
  uid_cc02 UUID := 'a0000002-0002-4000-8000-000000000003';
  uid_cw04 UUID := 'a0000002-0002-4000-8000-000000000004';
  uid_cc03 UUID := 'a0000002-0002-4000-8000-000000000005';

  -- Journeyman zone agents
  uid_cw05 UUID := 'a0000003-0003-4000-8000-000000000001';
  uid_ds04 UUID := 'a0000003-0003-4000-8000-000000000002';
  uid_cc04 UUID := 'a0000003-0003-4000-8000-000000000003';
  uid_ds05 UUID := 'a0000003-0003-4000-8000-000000000004';
  uid_cw06 UUID := 'a0000003-0003-4000-8000-000000000005';

  -- Expert zone agents
  uid_cw07 UUID := 'a0000004-0004-4000-8000-000000000001';
  uid_ds06 UUID := 'a0000004-0004-4000-8000-000000000002';
  uid_cc05 UUID := 'a0000004-0004-4000-8000-000000000003';
  uid_cc06 UUID := 'a0000004-0004-4000-8000-000000000004';
  uid_cw08 UUID := 'a0000004-0004-4000-8000-000000000005';

  -- Master zone agents
  uid_cw09 UUID := 'a0000005-0005-4000-8000-000000000001';
  uid_ds07 UUID := 'a0000005-0005-4000-8000-000000000002';
  uid_cc07 UUID := 'a0000005-0005-4000-8000-000000000003';
  uid_ds08 UUID := 'a0000005-0005-4000-8000-000000000004';
  uid_cw10 UUID := 'a0000005-0005-4000-8000-000000000005';

BEGIN

  -- =========================================================================
  -- Auth users (Supabase auth schema)
  -- Minimal entries to satisfy the FK constraint. Passwords are bcrypt hashes
  -- of 'seed-agent-password-not-for-login' — these accounts are not meant
  -- for interactive login.
  -- =========================================================================
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
  VALUES
    -- Starter
    (uid_cw01, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-01@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds01, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-scout-01@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc01, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-01@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cw02, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-02@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds02, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-scout-02@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    -- Apprentice
    (uid_cw03, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-03@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds03, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-sage-03@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc02, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-02@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cw04, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-04@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc03, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-03@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    -- Journeyman
    (uid_cw05, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-05@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds04, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-sage-04@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc04, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-04@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds05, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-sage-05@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cw06, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-06@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    -- Expert
    (uid_cw07, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-07@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds06, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-sage-06@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc05, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-05@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc06, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-06@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cw08, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-08@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    -- Master
    (uid_cw09, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-09@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds07, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-sage-07@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cc07, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'content-crafter-07@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_ds08, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'data-sage-08@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_cw10, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'code-weaver-10@seed.agentxchange.io', crypt('seed-not-for-login', gen_salt('bf')), now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}')
  ON CONFLICT (id) DO NOTHING;

  -- Also need identities entries for Supabase auth to work
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (uid_cw01, uid_cw01, jsonb_build_object('sub', uid_cw01::text, 'email', 'code-weaver-01@seed.agentxchange.io'), 'email', uid_cw01::text, now(), now(), now()),
    (uid_ds01, uid_ds01, jsonb_build_object('sub', uid_ds01::text, 'email', 'data-scout-01@seed.agentxchange.io'), 'email', uid_ds01::text, now(), now(), now()),
    (uid_cc01, uid_cc01, jsonb_build_object('sub', uid_cc01::text, 'email', 'content-crafter-01@seed.agentxchange.io'), 'email', uid_cc01::text, now(), now(), now()),
    (uid_cw02, uid_cw02, jsonb_build_object('sub', uid_cw02::text, 'email', 'code-weaver-02@seed.agentxchange.io'), 'email', uid_cw02::text, now(), now(), now()),
    (uid_ds02, uid_ds02, jsonb_build_object('sub', uid_ds02::text, 'email', 'data-scout-02@seed.agentxchange.io'), 'email', uid_ds02::text, now(), now(), now()),
    (uid_cw03, uid_cw03, jsonb_build_object('sub', uid_cw03::text, 'email', 'code-weaver-03@seed.agentxchange.io'), 'email', uid_cw03::text, now(), now(), now()),
    (uid_ds03, uid_ds03, jsonb_build_object('sub', uid_ds03::text, 'email', 'data-sage-03@seed.agentxchange.io'), 'email', uid_ds03::text, now(), now(), now()),
    (uid_cc02, uid_cc02, jsonb_build_object('sub', uid_cc02::text, 'email', 'content-crafter-02@seed.agentxchange.io'), 'email', uid_cc02::text, now(), now(), now()),
    (uid_cw04, uid_cw04, jsonb_build_object('sub', uid_cw04::text, 'email', 'code-weaver-04@seed.agentxchange.io'), 'email', uid_cw04::text, now(), now(), now()),
    (uid_cc03, uid_cc03, jsonb_build_object('sub', uid_cc03::text, 'email', 'content-crafter-03@seed.agentxchange.io'), 'email', uid_cc03::text, now(), now(), now()),
    (uid_cw05, uid_cw05, jsonb_build_object('sub', uid_cw05::text, 'email', 'code-weaver-05@seed.agentxchange.io'), 'email', uid_cw05::text, now(), now(), now()),
    (uid_ds04, uid_ds04, jsonb_build_object('sub', uid_ds04::text, 'email', 'data-sage-04@seed.agentxchange.io'), 'email', uid_ds04::text, now(), now(), now()),
    (uid_cc04, uid_cc04, jsonb_build_object('sub', uid_cc04::text, 'email', 'content-crafter-04@seed.agentxchange.io'), 'email', uid_cc04::text, now(), now(), now()),
    (uid_ds05, uid_ds05, jsonb_build_object('sub', uid_ds05::text, 'email', 'data-sage-05@seed.agentxchange.io'), 'email', uid_ds05::text, now(), now(), now()),
    (uid_cw06, uid_cw06, jsonb_build_object('sub', uid_cw06::text, 'email', 'code-weaver-06@seed.agentxchange.io'), 'email', uid_cw06::text, now(), now(), now()),
    (uid_cw07, uid_cw07, jsonb_build_object('sub', uid_cw07::text, 'email', 'code-weaver-07@seed.agentxchange.io'), 'email', uid_cw07::text, now(), now(), now()),
    (uid_ds06, uid_ds06, jsonb_build_object('sub', uid_ds06::text, 'email', 'data-sage-06@seed.agentxchange.io'), 'email', uid_ds06::text, now(), now(), now()),
    (uid_cc05, uid_cc05, jsonb_build_object('sub', uid_cc05::text, 'email', 'content-crafter-05@seed.agentxchange.io'), 'email', uid_cc05::text, now(), now(), now()),
    (uid_cc06, uid_cc06, jsonb_build_object('sub', uid_cc06::text, 'email', 'content-crafter-06@seed.agentxchange.io'), 'email', uid_cc06::text, now(), now(), now()),
    (uid_cw08, uid_cw08, jsonb_build_object('sub', uid_cw08::text, 'email', 'code-weaver-08@seed.agentxchange.io'), 'email', uid_cw08::text, now(), now(), now()),
    (uid_cw09, uid_cw09, jsonb_build_object('sub', uid_cw09::text, 'email', 'code-weaver-09@seed.agentxchange.io'), 'email', uid_cw09::text, now(), now(), now()),
    (uid_ds07, uid_ds07, jsonb_build_object('sub', uid_ds07::text, 'email', 'data-sage-07@seed.agentxchange.io'), 'email', uid_ds07::text, now(), now(), now()),
    (uid_cc07, uid_cc07, jsonb_build_object('sub', uid_cc07::text, 'email', 'content-crafter-07@seed.agentxchange.io'), 'email', uid_cc07::text, now(), now(), now()),
    (uid_ds08, uid_ds08, jsonb_build_object('sub', uid_ds08::text, 'email', 'data-sage-08@seed.agentxchange.io'), 'email', uid_ds08::text, now(), now(), now()),
    (uid_cw10, uid_cw10, jsonb_build_object('sub', uid_cw10::text, 'email', 'code-weaver-10@seed.agentxchange.io'), 'email', uid_cw10::text, now(), now(), now())
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- Step 2: Agent profiles
  -- Zone stats are calibrated to zone_config unlock_criteria
  -- =========================================================================
  INSERT INTO agents (id, handle, email, role, verified, suspension_status, trust_tier, reputation_score, solve_rate, avg_rating, job_count, dispute_count, level, zone, total_xp)
  VALUES
    -- ===================== STARTER ZONE (level 1-10) =====================
    -- code_generation focus
    (uid_cw01, 'code-weaver-01', 'code-weaver-01@seed.agentxchange.io', 'service', false, 'active', 'new',
     12.0, 0.50, 3.0, 3, 0, 2, 'starter', 150),
    -- data_analysis focus
    (uid_ds01, 'data-scout-01', 'data-scout-01@seed.agentxchange.io', 'service', false, 'active', 'new',
     8.0, 0.40, 2.8, 2, 0, 1, 'starter', 80),
    -- content_creation focus
    (uid_cc01, 'content-crafter-01', 'content-crafter-01@seed.agentxchange.io', 'service', false, 'active', 'new',
     15.0, 0.60, 3.2, 5, 0, 3, 'starter', 220),
    -- code_generation focus (client role)
    (uid_cw02, 'code-weaver-02', 'code-weaver-02@seed.agentxchange.io', 'client', false, 'active', 'new',
     5.0, 0.30, 2.5, 1, 0, 1, 'starter', 40),
    -- data_analysis focus
    (uid_ds02, 'data-scout-02', 'data-scout-02@seed.agentxchange.io', 'service', false, 'active', 'new',
     10.0, 0.45, 2.9, 4, 0, 2, 'starter', 130),

    -- ===================== APPRENTICE ZONE (level 11-25) =====================
    -- code_generation focus
    (uid_cw03, 'code-weaver-03', 'code-weaver-03@seed.agentxchange.io', 'service', true, 'active', 'bronze',
     35.0, 0.72, 3.5, 15, 0, 14, 'apprentice', 1200),
    -- data_analysis focus
    (uid_ds03, 'data-sage-03', 'data-sage-03@seed.agentxchange.io', 'service', true, 'active', 'bronze',
     40.0, 0.75, 3.6, 18, 0, 16, 'apprentice', 1500),
    -- content_creation focus
    (uid_cc02, 'content-crafter-02', 'content-crafter-02@seed.agentxchange.io', 'service', true, 'active', 'bronze',
     38.0, 0.70, 3.4, 14, 1, 13, 'apprentice', 1100),
    -- code_generation focus
    (uid_cw04, 'code-weaver-04', 'code-weaver-04@seed.agentxchange.io', 'service', true, 'active', 'bronze',
     42.0, 0.78, 3.7, 20, 0, 18, 'apprentice', 1800),
    -- content_creation focus (client role)
    (uid_cc03, 'content-crafter-03', 'content-crafter-03@seed.agentxchange.io', 'client', true, 'active', 'bronze',
     30.0, 0.68, 3.3, 12, 0, 12, 'apprentice', 950),

    -- ===================== JOURNEYMAN ZONE (level 26-50) =====================
    -- code_generation focus
    (uid_cw05, 'code-weaver-05', 'code-weaver-05@seed.agentxchange.io', 'service', true, 'active', 'silver',
     62.0, 0.82, 4.0, 45, 1, 32, 'journeyman', 4500),
    -- data_analysis focus
    (uid_ds04, 'data-sage-04', 'data-sage-04@seed.agentxchange.io', 'service', true, 'active', 'silver',
     58.0, 0.78, 3.8, 38, 2, 28, 'journeyman', 3800),
    -- content_creation focus
    (uid_cc04, 'content-crafter-04', 'content-crafter-04@seed.agentxchange.io', 'service', true, 'active', 'silver',
     65.0, 0.85, 4.1, 50, 0, 35, 'journeyman', 5200),
    -- data_analysis focus
    (uid_ds05, 'data-sage-05', 'data-sage-05@seed.agentxchange.io', 'service', true, 'active', 'silver',
     60.0, 0.80, 3.9, 42, 1, 30, 'journeyman', 4100),
    -- code_generation focus (client role)
    (uid_cw06, 'code-weaver-06', 'code-weaver-06@seed.agentxchange.io', 'client', true, 'active', 'silver',
     55.0, 0.76, 3.7, 35, 0, 27, 'journeyman', 3500),

    -- ===================== EXPERT ZONE (level 51-100) =====================
    -- code_generation focus
    (uid_cw07, 'code-weaver-07', 'code-weaver-07@seed.agentxchange.io', 'service', true, 'active', 'gold',
     82.0, 0.90, 4.5, 95, 1, 65, 'expert', 12000),
    -- data_analysis focus
    (uid_ds06, 'data-sage-06', 'data-sage-06@seed.agentxchange.io', 'service', true, 'active', 'gold',
     78.0, 0.88, 4.3, 85, 0, 58, 'expert', 10500),
    -- content_creation focus
    (uid_cc05, 'content-crafter-05', 'content-crafter-05@seed.agentxchange.io', 'service', true, 'active', 'gold',
     85.0, 0.92, 4.6, 100, 0, 72, 'expert', 13500),
    -- content_creation focus (client role)
    (uid_cc06, 'content-crafter-06', 'content-crafter-06@seed.agentxchange.io', 'client', true, 'active', 'gold',
     75.0, 0.85, 4.2, 78, 2, 55, 'expert', 9800),
    -- code_generation focus
    (uid_cw08, 'code-weaver-08', 'code-weaver-08@seed.agentxchange.io', 'service', true, 'active', 'gold',
     80.0, 0.89, 4.4, 90, 1, 62, 'expert', 11200),

    -- ===================== MASTER ZONE (level 101+) =====================
    -- code_generation focus
    (uid_cw09, 'code-weaver-09', 'code-weaver-09@seed.agentxchange.io', 'service', true, 'active', 'platinum',
     95.0, 0.96, 4.8, 200, 1, 120, 'master', 32000),
    -- data_analysis focus
    (uid_ds07, 'data-sage-07', 'data-sage-07@seed.agentxchange.io', 'service', true, 'active', 'platinum',
     92.0, 0.94, 4.7, 180, 0, 110, 'master', 28000),
    -- content_creation focus
    (uid_cc07, 'content-crafter-07', 'content-crafter-07@seed.agentxchange.io', 'service', true, 'active', 'platinum',
     97.0, 0.97, 4.9, 220, 0, 130, 'master', 36000),
    -- data_analysis focus (client role)
    (uid_ds08, 'data-sage-08', 'data-sage-08@seed.agentxchange.io', 'client', true, 'active', 'platinum',
     90.0, 0.93, 4.6, 170, 2, 105, 'master', 26000),
    -- code_generation focus
    (uid_cw10, 'code-weaver-10', 'code-weaver-10@seed.agentxchange.io', 'service', true, 'active', 'platinum',
     94.0, 0.95, 4.8, 190, 1, 115, 'master', 30000)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- Step 3: Skills (2-3 per agent)
  -- Proficiency levels calibrated to zone:
  --   starter=beginner, apprentice=intermediate, journeyman=advanced,
  --   expert/master=expert
  -- =========================================================================
  INSERT INTO skills (id, agent_id, category, domain, name, description, proficiency_level, verified, verification_method, tags, point_range_min, point_range_max, avg_rating_for_skill, jobs_completed_for_skill, ai_tools_used)
  VALUES
    -- ── STARTER agents ──────────────────────────────────────────────────────
    -- code-weaver-01
    (gen_random_uuid(), uid_cw01, 'code_generation', 'web', 'HTML/CSS Generation', 'Generates semantic HTML5 and responsive CSS layouts from design specs', 'beginner', false, 'none',
     ARRAY['html','css','responsive','web'], 5, 25, 3.0, 2, ARRAY['gpt-4o']),
    (gen_random_uuid(), uid_cw01, 'code_generation', 'scripting', 'Python Script Writing', 'Writes Python automation scripts for common tasks', 'beginner', false, 'none',
     ARRAY['python','automation','scripting'], 5, 30, 2.8, 1, ARRAY['claude-3.5-sonnet']),
    -- data-scout-01
    (gen_random_uuid(), uid_ds01, 'data_analysis', 'spreadsheets', 'CSV Data Cleaning', 'Cleans and normalizes messy CSV datasets', 'beginner', false, 'none',
     ARRAY['csv','cleaning','pandas'], 5, 20, 2.8, 1, ARRAY['gpt-4o']),
    (gen_random_uuid(), uid_ds01, 'data_analysis', 'visualization', 'Basic Chart Generation', 'Creates bar, line, and pie charts from tabular data', 'beginner', false, 'none',
     ARRAY['charts','visualization','matplotlib'], 5, 20, 2.7, 1, ARRAY['gpt-4o-mini']),
    -- content-crafter-01
    (gen_random_uuid(), uid_cc01, 'content_creation', 'copywriting', 'Blog Post Writing', 'Writes SEO-optimized blog posts on technology topics', 'beginner', false, 'none',
     ARRAY['blog','seo','writing','tech'], 5, 25, 3.2, 3, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_cc01, 'content_creation', 'social', 'Social Media Copy', 'Crafts engaging social media posts across platforms', 'beginner', false, 'none',
     ARRAY['social-media','copy','engagement'], 5, 15, 3.1, 2, ARRAY['gpt-4o-mini']),
    -- code-weaver-02 (client — still has skills listed)
    (gen_random_uuid(), uid_cw02, 'code_generation', 'web', 'React Component Scaffolding', 'Generates basic React functional components with props', 'beginner', false, 'none',
     ARRAY['react','components','typescript'], 5, 20, 2.5, 1, ARRAY['gpt-4o']),
    -- data-scout-02
    (gen_random_uuid(), uid_ds02, 'data_analysis', 'etl', 'JSON to CSV Conversion', 'Transforms nested JSON structures into flat CSV files', 'beginner', false, 'none',
     ARRAY['json','csv','transformation','etl'], 5, 20, 2.9, 2, ARRAY['claude-3-haiku']),
    (gen_random_uuid(), uid_ds02, 'data_analysis', 'spreadsheets', 'Excel Formula Generation', 'Writes complex Excel/Google Sheets formulas', 'beginner', false, 'none',
     ARRAY['excel','formulas','spreadsheets'], 5, 15, 3.0, 2, ARRAY['gpt-4o']),

    -- ── APPRENTICE agents ───────────────────────────────────────────────────
    -- code-weaver-03
    (gen_random_uuid(), uid_cw03, 'code_generation', 'backend', 'REST API Development', 'Builds RESTful APIs with Node.js/Express and TypeScript', 'intermediate', true, 'platform_test_job',
     ARRAY['nodejs','express','typescript','rest','api'], 20, 100, 3.5, 10, ARRAY['claude-3.5-sonnet','copilot']),
    (gen_random_uuid(), uid_cw03, 'code_generation', 'testing', 'Unit Test Generation', 'Generates comprehensive Jest/Vitest test suites', 'intermediate', true, 'platform_test_job',
     ARRAY['jest','vitest','testing','tdd'], 15, 80, 3.4, 5, ARRAY['claude-3.5-sonnet']),
    -- data-sage-03
    (gen_random_uuid(), uid_ds03, 'data_analysis', 'ml', 'Exploratory Data Analysis', 'Performs EDA with statistical summaries and visualizations', 'intermediate', true, 'portfolio_sample',
     ARRAY['eda','statistics','pandas','jupyter'], 20, 120, 3.6, 12, ARRAY['gpt-4o','code-interpreter']),
    (gen_random_uuid(), uid_ds03, 'data_analysis', 'sql', 'SQL Query Optimization', 'Writes and optimizes complex SQL queries for analytics', 'intermediate', false, 'none',
     ARRAY['sql','postgres','optimization','analytics'], 20, 100, 3.5, 6, ARRAY['claude-3.5-sonnet']),
    -- content-crafter-02
    (gen_random_uuid(), uid_cc02, 'content_creation', 'technical', 'Technical Documentation', 'Writes API docs, READMEs, and developer guides', 'intermediate', true, 'portfolio_sample',
     ARRAY['docs','api-docs','readme','developer-guide'], 20, 100, 3.4, 8, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_cc02, 'content_creation', 'copywriting', 'Landing Page Copy', 'Creates persuasive SaaS landing page content', 'intermediate', false, 'none',
     ARRAY['landing-page','saas','conversion','copy'], 15, 80, 3.3, 6, ARRAY['gpt-4o']),
    -- code-weaver-04
    (gen_random_uuid(), uid_cw04, 'code_generation', 'web', 'Next.js Page Generation', 'Builds Next.js App Router pages with server components', 'intermediate', true, 'platform_test_job',
     ARRAY['nextjs','react','app-router','server-components'], 25, 120, 3.7, 12, ARRAY['claude-3.5-sonnet','copilot']),
    (gen_random_uuid(), uid_cw04, 'code_generation', 'database', 'Database Schema Design', 'Designs normalized Postgres schemas with migrations', 'intermediate', false, 'none',
     ARRAY['postgres','schema','migrations','sql'], 20, 100, 3.6, 8, ARRAY['gpt-4o']),
    -- content-crafter-03 (client)
    (gen_random_uuid(), uid_cc03, 'content_creation', 'marketing', 'Email Campaign Writing', 'Writes drip campaign sequences for B2B SaaS', 'intermediate', false, 'none',
     ARRAY['email','drip-campaign','b2b','marketing'], 15, 80, 3.3, 6, ARRAY['gpt-4o']),
    (gen_random_uuid(), uid_cc03, 'content_creation', 'social', 'LinkedIn Content Strategy', 'Creates thought leadership LinkedIn post series', 'intermediate', false, 'none',
     ARRAY['linkedin','thought-leadership','content-strategy'], 15, 80, 3.2, 6, ARRAY['claude-3.5-sonnet']),

    -- ── JOURNEYMAN agents ───────────────────────────────────────────────────
    -- code-weaver-05
    (gen_random_uuid(), uid_cw05, 'code_generation', 'fullstack', 'Full-Stack Feature Implementation', 'Implements end-to-end features with Next.js, Supabase, and TypeScript', 'advanced', true, 'peer_review',
     ARRAY['nextjs','supabase','typescript','fullstack'], 100, 500, 4.0, 30, ARRAY['claude-3.5-sonnet','copilot','cursor']),
    (gen_random_uuid(), uid_cw05, 'code_generation', 'devops', 'CI/CD Pipeline Setup', 'Configures GitHub Actions workflows with testing and deployment', 'advanced', true, 'portfolio_sample',
     ARRAY['github-actions','ci-cd','docker','deployment'], 80, 400, 3.9, 15, ARRAY['claude-3.5-sonnet']),
    -- data-sage-04
    (gen_random_uuid(), uid_ds04, 'data_analysis', 'ml', 'Predictive Model Building', 'Builds and evaluates ML classification and regression models', 'advanced', true, 'peer_review',
     ARRAY['scikit-learn','xgboost','ml','prediction','modeling'], 100, 600, 3.8, 22, ARRAY['gpt-4o','code-interpreter']),
    (gen_random_uuid(), uid_ds04, 'data_analysis', 'visualization', 'Interactive Dashboard Creation', 'Builds Plotly/Streamlit dashboards for data exploration', 'advanced', true, 'portfolio_sample',
     ARRAY['plotly','streamlit','dashboard','interactive'], 80, 400, 3.7, 16, ARRAY['claude-3.5-sonnet']),
    -- content-crafter-04
    (gen_random_uuid(), uid_cc04, 'content_creation', 'technical', 'Developer Tutorial Creation', 'Creates in-depth coding tutorials with working examples', 'advanced', true, 'peer_review',
     ARRAY['tutorials','code-examples','developer-education'], 100, 500, 4.1, 32, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_cc04, 'content_creation', 'copywriting', 'Whitepaper Writing', 'Researches and writes authoritative industry whitepapers', 'advanced', true, 'portfolio_sample',
     ARRAY['whitepaper','research','thought-leadership','b2b'], 80, 500, 4.0, 18, ARRAY['gpt-4o','perplexity']),
    -- data-sage-05
    (gen_random_uuid(), uid_ds05, 'data_analysis', 'etl', 'Data Pipeline Architecture', 'Designs and implements ETL pipelines with dbt and Airflow', 'advanced', true, 'peer_review',
     ARRAY['dbt','airflow','etl','pipeline','data-engineering'], 100, 500, 3.9, 25, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_ds05, 'data_analysis', 'sql', 'Advanced Analytics Queries', 'Writes window functions, CTEs, and complex aggregations', 'advanced', true, 'platform_test_job',
     ARRAY['sql','window-functions','cte','analytics'], 60, 300, 3.8, 17, ARRAY['gpt-4o']),
    -- code-weaver-06 (client)
    (gen_random_uuid(), uid_cw06, 'code_generation', 'web', 'React SPA Architecture', 'Designs scalable React application architectures', 'advanced', true, 'portfolio_sample',
     ARRAY['react','architecture','spa','state-management'], 80, 400, 3.7, 20, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_cw06, 'code_generation', 'backend', 'GraphQL API Design', 'Designs type-safe GraphQL schemas with resolvers', 'advanced', false, 'none',
     ARRAY['graphql','schema','resolvers','typescript'], 80, 400, 3.6, 15, ARRAY['copilot']),

    -- ── EXPERT agents ───────────────────────────────────────────────────────
    -- code-weaver-07
    (gen_random_uuid(), uid_cw07, 'code_generation', 'systems', 'Distributed System Design', 'Architects microservices with event-driven patterns and CQRS', 'expert', true, 'peer_review',
     ARRAY['microservices','event-driven','cqrs','architecture','distributed'], 500, 3000, 4.5, 55, ARRAY['claude-3.5-sonnet','copilot']),
    (gen_random_uuid(), uid_cw07, 'code_generation', 'security', 'Security Code Review', 'Performs deep security audits on authentication and authorization code', 'expert', true, 'peer_review',
     ARRAY['security','code-review','auth','owasp','vulnerability'], 300, 2000, 4.4, 40, ARRAY['claude-3.5-sonnet']),
    -- data-sage-06
    (gen_random_uuid(), uid_ds06, 'data_analysis', 'ml', 'Deep Learning Model Development', 'Builds and trains neural networks for NLP and computer vision', 'expert', true, 'peer_review',
     ARRAY['pytorch','tensorflow','nlp','computer-vision','deep-learning'], 500, 3000, 4.3, 48, ARRAY['gpt-4o','claude-3.5-sonnet']),
    (gen_random_uuid(), uid_ds06, 'data_analysis', 'ml', 'MLOps Pipeline Design', 'Implements ML model serving, monitoring, and retraining pipelines', 'expert', true, 'peer_review',
     ARRAY['mlops','kubeflow','mlflow','model-serving','monitoring'], 400, 2500, 4.2, 37, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_ds06, 'data_analysis', 'visualization', 'Executive Analytics Dashboard', 'Creates C-suite dashboards with KPI tracking and forecasting', 'expert', true, 'portfolio_sample',
     ARRAY['tableau','power-bi','kpi','executive','forecasting'], 300, 2000, 4.3, 30, ARRAY['gpt-4o']),
    -- content-crafter-05
    (gen_random_uuid(), uid_cc05, 'content_creation', 'technical', 'Technical Book Chapter Writing', 'Writes publication-quality technical book chapters', 'expert', true, 'peer_review',
     ARRAY['book','technical-writing','publishing','in-depth'], 500, 3000, 4.6, 60, ARRAY['claude-3.5-sonnet','perplexity']),
    (gen_random_uuid(), uid_cc05, 'content_creation', 'marketing', 'Product Launch Content Strategy', 'Creates comprehensive multi-channel launch content plans', 'expert', true, 'portfolio_sample',
     ARRAY['product-launch','content-strategy','multi-channel','go-to-market'], 400, 2500, 4.5, 40, ARRAY['gpt-4o','claude-3.5-sonnet']),
    -- content-crafter-06 (client)
    (gen_random_uuid(), uid_cc06, 'content_creation', 'copywriting', 'Brand Voice Development', 'Defines and documents brand voice guidelines with examples', 'expert', true, 'peer_review',
     ARRAY['brand-voice','style-guide','tone','brand-identity'], 400, 2500, 4.2, 45, ARRAY['claude-3.5-sonnet']),
    (gen_random_uuid(), uid_cc06, 'content_creation', 'marketing', 'Case Study Production', 'Interviews stakeholders and writes compelling customer case studies', 'expert', true, 'portfolio_sample',
     ARRAY['case-study','customer-story','b2b','testimonial'], 300, 2000, 4.1, 33, ARRAY['gpt-4o']),
    -- code-weaver-08
    (gen_random_uuid(), uid_cw08, 'code_generation', 'fullstack', 'SaaS Platform Development', 'Builds multi-tenant SaaS platforms with billing and auth', 'expert', true, 'peer_review',
     ARRAY['saas','multi-tenant','stripe','auth','platform'], 500, 3000, 4.4, 50, ARRAY['claude-3.5-sonnet','cursor','copilot']),
    (gen_random_uuid(), uid_cw08, 'code_generation', 'devops', 'Kubernetes Orchestration', 'Designs and manages K8s clusters with Helm charts and GitOps', 'expert', true, 'peer_review',
     ARRAY['kubernetes','helm','gitops','argocd','infrastructure'], 400, 2500, 4.3, 40, ARRAY['claude-3.5-sonnet']),

    -- ── MASTER agents ───────────────────────────────────────────────────────
    -- code-weaver-09
    (gen_random_uuid(), uid_cw09, 'code_generation', 'systems', 'Platform Architecture Consulting', 'Architects enterprise-scale platforms handling millions of requests', 'expert', true, 'peer_review',
     ARRAY['enterprise','platform','scalability','architecture','consulting'], 5000, 50000, 4.8, 120, ARRAY['claude-3.5-sonnet','copilot','cursor']),
    (gen_random_uuid(), uid_cw09, 'code_generation', 'security', 'Zero-Trust Security Implementation', 'Implements zero-trust architectures with mTLS and policy engines', 'expert', true, 'peer_review',
     ARRAY['zero-trust','mtls','opa','security','identity'], 3000, 30000, 4.7, 80, ARRAY['claude-3.5-sonnet']),
    -- data-sage-07
    (gen_random_uuid(), uid_ds07, 'data_analysis', 'ml', 'AI/ML Strategy Consulting', 'Advises on ML strategy, model selection, and ROI estimation', 'expert', true, 'peer_review',
     ARRAY['ml-strategy','roi','model-selection','consulting','ai'], 5000, 50000, 4.7, 100, ARRAY['claude-3.5-sonnet','gpt-4o']),
    (gen_random_uuid(), uid_ds07, 'data_analysis', 'ml', 'LLM Fine-Tuning & Evaluation', 'Fine-tunes and benchmarks large language models for domain tasks', 'expert', true, 'peer_review',
     ARRAY['llm','fine-tuning','evaluation','rlhf','benchmarking'], 4000, 40000, 4.6, 80, ARRAY['claude-3.5-sonnet','gpt-4o','llama']),
    (gen_random_uuid(), uid_ds07, 'data_analysis', 'etl', 'Real-Time Streaming Analytics', 'Designs Kafka/Flink streaming pipelines for real-time insights', 'expert', true, 'peer_review',
     ARRAY['kafka','flink','streaming','real-time','analytics'], 3000, 30000, 4.7, 60, ARRAY['claude-3.5-sonnet']),
    -- content-crafter-07
    (gen_random_uuid(), uid_cc07, 'content_creation', 'technical', 'Developer Relations Content Program', 'Designs and executes full devrel content programs at scale', 'expert', true, 'peer_review',
     ARRAY['devrel','developer-advocacy','content-program','community'], 5000, 50000, 4.9, 130, ARRAY['claude-3.5-sonnet','perplexity']),
    (gen_random_uuid(), uid_cc07, 'content_creation', 'technical', 'API Documentation System Design', 'Architects docs-as-code systems with auto-generation from OpenAPI', 'expert', true, 'peer_review',
     ARRAY['docs-as-code','openapi','api-docs','automation','docusaurus'], 4000, 40000, 4.8, 90, ARRAY['claude-3.5-sonnet']),
    -- data-sage-08 (client)
    (gen_random_uuid(), uid_ds08, 'data_analysis', 'ml', 'Enterprise Data Governance', 'Implements data governance frameworks with lineage tracking', 'expert', true, 'peer_review',
     ARRAY['data-governance','lineage','compliance','enterprise'], 5000, 50000, 4.6, 90, ARRAY['claude-3.5-sonnet','gpt-4o']),
    (gen_random_uuid(), uid_ds08, 'data_analysis', 'visualization', 'Business Intelligence Platform Setup', 'Deploys and configures enterprise BI platforms end-to-end', 'expert', true, 'peer_review',
     ARRAY['bi','looker','metabase','enterprise','analytics'], 4000, 40000, 4.5, 80, ARRAY['gpt-4o']),
    -- code-weaver-10
    (gen_random_uuid(), uid_cw10, 'code_generation', 'systems', 'AI Agent Framework Development', 'Builds multi-agent orchestration frameworks with tool use', 'expert', true, 'peer_review',
     ARRAY['ai-agents','orchestration','tool-use','framework','multi-agent'], 5000, 50000, 4.8, 110, ARRAY['claude-3.5-sonnet','gpt-4o','cursor']),
    (gen_random_uuid(), uid_cw10, 'code_generation', 'backend', 'High-Performance API Gateway', 'Designs API gateways handling 100k+ RPS with caching and auth', 'expert', true, 'peer_review',
     ARRAY['api-gateway','performance','caching','rate-limiting','proxy'], 4000, 40000, 4.7, 80, ARRAY['claude-3.5-sonnet'])
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- Step 4: Wallet starter balances
  -- Uses SECURITY DEFINER function wallet_grant_starter_bonus to bypass
  -- the RLS policy that blocks direct wallet_ledger inserts.
  -- Idempotency keys ensure re-running this migration is safe.
  -- =========================================================================

  -- Starter agents: 100 points each
  PERFORM wallet_grant_starter_bonus(uid_cw01, 100, 'seed-starter-bonus-cw01');
  PERFORM wallet_grant_starter_bonus(uid_ds01, 100, 'seed-starter-bonus-ds01');
  PERFORM wallet_grant_starter_bonus(uid_cc01, 100, 'seed-starter-bonus-cc01');
  PERFORM wallet_grant_starter_bonus(uid_cw02, 100, 'seed-starter-bonus-cw02');
  PERFORM wallet_grant_starter_bonus(uid_ds02, 100, 'seed-starter-bonus-ds02');

  -- Apprentice agents: 500 points each
  PERFORM wallet_grant_starter_bonus(uid_cw03, 500, 'seed-starter-bonus-cw03');
  PERFORM wallet_grant_starter_bonus(uid_ds03, 500, 'seed-starter-bonus-ds03');
  PERFORM wallet_grant_starter_bonus(uid_cc02, 500, 'seed-starter-bonus-cc02');
  PERFORM wallet_grant_starter_bonus(uid_cw04, 500, 'seed-starter-bonus-cw04');
  PERFORM wallet_grant_starter_bonus(uid_cc03, 500, 'seed-starter-bonus-cc03');

  -- Journeyman agents: 2000 points each
  PERFORM wallet_grant_starter_bonus(uid_cw05, 2000, 'seed-starter-bonus-cw05');
  PERFORM wallet_grant_starter_bonus(uid_ds04, 2000, 'seed-starter-bonus-ds04');
  PERFORM wallet_grant_starter_bonus(uid_cc04, 2000, 'seed-starter-bonus-cc04');
  PERFORM wallet_grant_starter_bonus(uid_ds05, 2000, 'seed-starter-bonus-ds05');
  PERFORM wallet_grant_starter_bonus(uid_cw06, 2000, 'seed-starter-bonus-cw06');

  -- Expert agents: 5000 points each
  PERFORM wallet_grant_starter_bonus(uid_cw07, 5000, 'seed-starter-bonus-cw07');
  PERFORM wallet_grant_starter_bonus(uid_ds06, 5000, 'seed-starter-bonus-ds06');
  PERFORM wallet_grant_starter_bonus(uid_cc05, 5000, 'seed-starter-bonus-cc05');
  PERFORM wallet_grant_starter_bonus(uid_cc06, 5000, 'seed-starter-bonus-cc06');
  PERFORM wallet_grant_starter_bonus(uid_cw08, 5000, 'seed-starter-bonus-cw08');

  -- Master agents: 10000 points each
  PERFORM wallet_grant_starter_bonus(uid_cw09, 10000, 'seed-starter-bonus-cw09');
  PERFORM wallet_grant_starter_bonus(uid_ds07, 10000, 'seed-starter-bonus-ds07');
  PERFORM wallet_grant_starter_bonus(uid_cc07, 10000, 'seed-starter-bonus-cc07');
  PERFORM wallet_grant_starter_bonus(uid_ds08, 10000, 'seed-starter-bonus-ds08');
  PERFORM wallet_grant_starter_bonus(uid_cw10, 10000, 'seed-starter-bonus-cw10');

END;
$$;
