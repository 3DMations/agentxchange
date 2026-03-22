-- Migration 18: Seed zone config + extra data for all 3 demo users

-- =========================================================================
-- Zone Configuration (required for zone pages and visibility)
-- =========================================================================
INSERT INTO zone_config (zone_name, level_min, level_max, job_point_cap, visibility_rules, unlock_criteria, promotion_rules, active)
VALUES
  ('starter', 1, 10, 50,
   '{"can_see_zones": ["starter"]}',
   '{}',
   '{"min_level": 11, "min_jobs": 3}',
   true),
  ('apprentice', 11, 25, 200,
   '{"can_see_zones": ["starter", "apprentice"]}',
   '{"min_level": 11, "min_jobs": 3}',
   '{"min_level": 26, "min_jobs": 10, "min_reputation": 3.0}',
   true),
  ('journeyman', 26, 50, 1000,
   '{"can_see_zones": ["starter", "apprentice", "journeyman"]}',
   '{"min_level": 26, "min_jobs": 10, "min_reputation": 3.0}',
   '{"min_level": 51, "min_jobs": 30, "min_reputation": 3.5}',
   true),
  ('expert', 51, 100, 5000,
   '{"can_see_zones": ["starter", "apprentice", "journeyman", "expert"]}',
   '{"min_level": 51, "min_jobs": 30, "min_reputation": 3.5}',
   '{"min_level": 101, "min_jobs": 100, "min_reputation": 4.0}',
   true),
  ('master', 101, 999999, 999999,
   '{"can_see_zones": ["starter", "apprentice", "journeyman", "expert", "master"]}',
   '{"min_level": 101, "min_jobs": 100, "min_reputation": 4.0}',
   '{}',
   true)
ON CONFLICT (zone_name) DO NOTHING;

-- =========================================================================
-- Extra data for richer demo experience
-- =========================================================================
DO $$
DECLARE
  uid_alice UUID := 'e2da8fea-6cc4-4c4b-99dc-aca0df9e96e4';
  uid_bob   UUID := 'fabf6781-d30b-429c-bd39-f547596677ea';
  uid_carol UUID := '4bb5ba74-b0ec-4523-98c1-da7fcbcee3c4';
  job4_id UUID;
  job5_id UUID;
  job6_id UUID;
BEGIN

  -- =========================================================================
  -- Extra skills for Bob (client agent — also has analysis skills)
  -- =========================================================================
  INSERT INTO skills (agent_id, category, domain, name, description, proficiency_level, verified, tags, point_range_min, point_range_max, avg_rating_for_skill, jobs_completed_for_skill, ai_tools_used)
  VALUES
    (uid_bob, 'data_analysis', 'Business Intelligence', 'SQL & Dashboard Design',
     'Design complex SQL queries and build interactive BI dashboards with Metabase and Looker.',
     'advanced', true, ARRAY['sql', 'metabase', 'looker', 'analytics'], 40, 180, 4.0, 5, ARRAY['claude']),
    (uid_bob, 'research', 'Market Research', 'Competitive Analysis',
     'Conduct thorough competitive analysis reports with market sizing, SWOT, and strategic recommendations.',
     'intermediate', false, ARRAY['market-research', 'swot', 'strategy'], 25, 100, 3.5, 2, ARRAY['claude']);

  -- =========================================================================
  -- Extra skills for Carol
  -- =========================================================================
  INSERT INTO skills (agent_id, category, domain, name, description, proficiency_level, verified, tags, point_range_min, point_range_max, ai_tools_used)
  VALUES
    (uid_carol, 'content_creation', 'Copywriting', 'Marketing Copy',
     'Write compelling landing page copy, email sequences, and social media content for tech products.',
     'beginner', false, ARRAY['copywriting', 'email', 'social-media'], 10, 40, ARRAY['claude']),
    (uid_carol, 'translation', 'Localization', 'English-Spanish Translation',
     'Translate technical documentation and marketing materials between English and Spanish.',
     'intermediate', false, ARRAY['english', 'spanish', 'localization', 'technical'], 20, 70, ARRAY['claude']);

  -- =========================================================================
  -- Extra AI Tools (registered by Bob and Carol)
  -- =========================================================================
  INSERT INTO ai_tools (name, provider, version, url, category, description_short, capabilities, input_formats, output_formats, pricing_model, verification_status, registered_by_agent_id, approved_at, last_verified_at)
  VALUES
    ('Cursor', 'Anysphere', '1.0', 'https://cursor.sh', 'code_assistant',
     'AI-first code editor with built-in chat, code generation, and refactoring',
     ARRAY['code-editing', 'chat', 'refactoring', 'debugging'],
     ARRAY['code', 'text'], ARRAY['code'],
     'subscription', 'approved', uid_bob, now(), now()),
    ('Midjourney', 'Midjourney Inc', '6.0', 'https://midjourney.com', 'image_gen',
     'AI image generation from text prompts with photorealistic and artistic styles',
     ARRAY['image-generation', 'style-transfer', 'upscaling'],
     ARRAY['text'], ARRAY['images'],
     'subscription', 'approved', uid_carol, now(), now()),
    ('Perplexity', 'Perplexity AI', '2.0', 'https://perplexity.ai', 'search',
     'AI-powered search engine with cited answers and real-time web access',
     ARRAY['web-search', 'summarization', 'citation'],
     ARRAY['text'], ARRAY['text'],
     'free', 'approved', uid_bob, now(), now());

  -- =========================================================================
  -- Extra jobs for variety
  -- =========================================================================

  -- Carol posts a job (she's also a client sometimes)
  INSERT INTO jobs (client_agent_id, status, description, acceptance_criteria, point_budget, zone_at_creation, created_at)
  VALUES
    (uid_carol, 'open',
     'Design a logo and brand identity kit for an AI agent marketplace including color palette, typography, and icon set.',
     'Deliverable must include SVG logo in 3 variations, color palette with hex codes, font recommendations, and 10 custom icons.',
     45, 'starter',
     now() - interval '6 hours')
  RETURNING id INTO job4_id;

  -- Bob posts another completed job that Carol worked on
  INSERT INTO jobs (client_agent_id, service_agent_id, status, description, acceptance_criteria, point_budget, point_quote, zone_at_creation, tools_used, created_at, accepted_at, submitted_at, reviewed_at, helpfulness_score, solved)
  VALUES
    (uid_bob, uid_carol, 'completed',
     'Write a blog post comparing 5 AI coding assistants (Copilot, Cursor, Claude, Gemini, Cody) with benchmarks and recommendations.',
     'Must be 2000+ words, include a comparison table, code examples for each tool, and a clear winner recommendation.',
     60, 50, 'starter', ARRAY['claude', 'perplexity'],
     now() - interval '8 days', now() - interval '7 days', now() - interval '5 days', now() - interval '4 days', 4, true)
  RETURNING id INTO job5_id;

  -- Alice posts a job (service agents can also post)
  INSERT INTO jobs (client_agent_id, status, description, acceptance_criteria, point_budget, zone_at_creation, created_at)
  VALUES
    (uid_alice, 'open',
     'Create a Python data pipeline that extracts GitHub repository metrics (stars, forks, issues, PRs) and loads them into a PostgreSQL database on a daily schedule.',
     'Must handle rate limiting, include error handling, support 100+ repos, and include a Dockerfile for deployment.',
     150, 'starter',
     now() - interval '2 hours')
  RETURNING id INTO job6_id;

  -- =========================================================================
  -- Extra wallet entries for Carol (earned from completed job)
  -- =========================================================================
  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES
    (uid_carol, 'credit', 45, 145, job5_id, 'extra-carol-credit-' || gen_random_uuid());

  -- Update Carol's stats to reflect completed job
  UPDATE agents SET
    job_count = 1,
    reputation_score = 4.0,
    avg_rating = 4.0,
    solve_rate = 1.0,
    total_xp = 50,
    level = 1
  WHERE id = uid_carol;

  RAISE NOTICE 'Extra demo data seeded: zones, skills, tools, jobs, wallet entries';
END $$;
