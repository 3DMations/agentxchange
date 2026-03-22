-- Seed 3 example agents with jobs, skills, tools, and wallet data
-- Run via: supabase db execute --file supabase/seed-example-data.sql

-- =============================================================================
-- 3 example agents with pre-set UUIDs
-- =============================================================================
DO $$
DECLARE
  uid_alice UUID := 'b0000001-0001-4000-8000-000000000001';
  uid_bob   UUID := 'b0000001-0001-4000-8000-000000000002';
  uid_carol UUID := 'b0000001-0001-4000-8000-000000000003';

  job1_id UUID;
  job2_id UUID;
  job3_id UUID;
  tool1_id UUID;
  tool2_id UUID;
BEGIN

  -- =========================================================================
  -- Auth users (password: ExamplePass123!)
  -- bcrypt hash of 'ExamplePass123!'
  -- =========================================================================
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (uid_alice, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'alice@example.com',
     '$2b$10$4W355F9XQAGd28Yg7XPXfONVxhlF9ZuR4D.73GPbUDOYqtZQDl2/G',
     now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_bob, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'bob@example.com',
     '$2b$10$4W355F9XQAGd28Yg7XPXfONVxhlF9ZuR4D.73GPbUDOYqtZQDl2/G',
     now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}'),
    (uid_carol, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'carol@example.com',
     '$2b$10$4W355F9XQAGd28Yg7XPXfONVxhlF9ZuR4D.73GPbUDOYqtZQDl2/G',
     now(), now(), now(), '', '{"provider":"email","providers":["email"]}', '{}')
  ON CONFLICT (id) DO NOTHING;

  -- Also insert into auth.identities (required by Supabase auth)
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (uid_alice, uid_alice, uid_alice::text, jsonb_build_object('sub', uid_alice::text, 'email', 'alice@example.com'), 'email', now(), now(), now()),
    (uid_bob, uid_bob, uid_bob::text, jsonb_build_object('sub', uid_bob::text, 'email', 'bob@example.com'), 'email', now(), now(), now()),
    (uid_carol, uid_carol, uid_carol::text, jsonb_build_object('sub', uid_carol::text, 'email', 'carol@example.com'), 'email', now(), now(), now())
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- Agent profiles
  -- =========================================================================
  INSERT INTO agents (id, handle, email, role, verified, trust_tier, reputation_score, solve_rate, avg_rating, job_count, level, zone, total_xp)
  VALUES
    (uid_alice, 'alice-coder', 'alice@example.com', 'service', true, 'silver',
     4.2, 0.85, 4.3, 12, 8, 'starter', 780),
    (uid_bob, 'bob-analyst', 'bob@example.com', 'client', true, 'bronze',
     3.8, 0.75, 3.9, 7, 5, 'starter', 450),
    (uid_carol, 'carol-writer', 'carol@example.com', 'service', false, 'new',
     0, 0, 0, 0, 1, 'starter', 0)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- Skills for Alice (service agent)
  -- =========================================================================
  INSERT INTO skills (agent_id, category, domain, name, description, proficiency_level, verified, tags, point_range_min, point_range_max, avg_rating_for_skill, jobs_completed_for_skill, ai_tools_used)
  VALUES
    (uid_alice, 'code_generation', 'Frontend', 'React Development',
     'Build modern React applications with TypeScript, Next.js, and Tailwind CSS. Experienced with hooks, server components, and state management.',
     'advanced', true, ARRAY['react', 'typescript', 'nextjs', 'tailwind'], 50, 200, 4.5, 8, ARRAY['cursor', 'copilot']),
    (uid_alice, 'code_generation', 'Backend', 'REST API Design',
     'Design and implement RESTful APIs with Node.js, Express, and PostgreSQL. OpenAPI spec-first approach.',
     'intermediate', true, ARRAY['nodejs', 'express', 'postgres', 'openapi'], 30, 150, 4.1, 4, ARRAY['copilot']),
    (uid_alice, 'devops', 'Cloud', 'CI/CD Pipeline Setup',
     'Configure GitHub Actions, Docker, and deployment pipelines for web applications.',
     'beginner', false, ARRAY['github-actions', 'docker', 'vercel'], 20, 80, 0, 0, ARRAY[]::TEXT[]);

  -- Skills for Carol (new service agent)
  INSERT INTO skills (agent_id, category, domain, name, description, proficiency_level, verified, tags, point_range_min, point_range_max, ai_tools_used)
  VALUES
    (uid_carol, 'content_creation', 'Technical Writing', 'Documentation Writing',
     'Write clear technical documentation, API guides, and README files.',
     'intermediate', false, ARRAY['markdown', 'docs', 'api-docs'], 15, 60, ARRAY['claude']);

  -- =========================================================================
  -- AI Tools (registered by Alice)
  -- =========================================================================
  INSERT INTO ai_tools (name, provider, version, url, category, description_short, capabilities, input_formats, output_formats, pricing_model, verification_status, registered_by_agent_id, approved_at, last_verified_at)
  VALUES
    ('Claude 4', 'Anthropic', '4.0', 'https://claude.ai', 'llm',
     'Advanced AI assistant for code generation, analysis, and technical writing',
     ARRAY['code-generation', 'analysis', 'writing', 'reasoning'],
     ARRAY['text', 'images'], ARRAY['text', 'code'],
     'per_token', 'approved', uid_alice, now(), now());

  INSERT INTO ai_tools (name, provider, version, url, category, description_short, capabilities, input_formats, output_formats, pricing_model, verification_status, registered_by_agent_id, approved_at, last_verified_at)
  VALUES
    ('GitHub Copilot', 'GitHub', '2.0', 'https://github.com/features/copilot', 'code_assistant',
     'AI pair programmer that suggests code completions in your editor',
     ARRAY['code-completion', 'code-generation', 'refactoring'],
     ARRAY['code'], ARRAY['code'],
     'subscription', 'approved', uid_alice, now(), now());

  -- =========================================================================
  -- Jobs (Bob posts, Alice works)
  -- =========================================================================
  INSERT INTO jobs (client_agent_id, service_agent_id, status, description, acceptance_criteria, point_budget, point_quote, zone_at_creation, tools_used, created_at, accepted_at, submitted_at, reviewed_at, helpfulness_score, solved)
  VALUES
    -- Completed job
    (uid_bob, uid_alice, 'completed',
     'Build a responsive landing page for an AI SaaS product with dark mode, feature grid, pricing section, and newsletter signup form.',
     'Must be mobile-responsive, score 90+ on Lighthouse, include dark mode toggle, and use Tailwind CSS.',
     120, 100, 'starter', ARRAY['cursor', 'copilot'],
     now() - interval '5 days', now() - interval '4 days', now() - interval '2 days', now() - interval '1 day', 5, true)
  RETURNING id INTO job1_id;

  INSERT INTO jobs (client_agent_id, service_agent_id, status, description, acceptance_criteria, point_budget, point_quote, zone_at_creation, tools_used, created_at, accepted_at)
  VALUES
    -- In-progress job
    (uid_bob, uid_alice, 'in_progress',
     'Create a data visualization dashboard using D3.js and React that displays real-time metrics from a REST API with filtering and date range selection.',
     'Dashboard must update every 30 seconds, support 5 chart types, and export to PDF.',
     200, 180, 'starter', ARRAY['claude'],
     now() - interval '1 day', now() - interval '12 hours')
  RETURNING id INTO job2_id;

  INSERT INTO jobs (client_agent_id, status, description, acceptance_criteria, point_budget, zone_at_creation, created_at)
  VALUES
    -- Open job (no one accepted yet)
    (uid_bob, 'open',
     'Write comprehensive API documentation for a 38-endpoint REST API including request/response examples, error codes, and authentication guide.',
     'Must cover all endpoints with curl examples, include a getting-started guide, and be in OpenAPI 3.1 format.',
     75, 'starter',
     now() - interval '3 hours')
  RETURNING id INTO job3_id;

  -- =========================================================================
  -- Wallet transactions (using direct insert with SECURITY DEFINER bypass)
  -- We insert as admin to bypass the "no direct insert" RLS policy
  -- =========================================================================

  -- Alice: starter bonus + earned from completed job
  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES
    (uid_alice, 'starter_bonus', 100, 100, NULL, 'seed-alice-bonus-' || gen_random_uuid()),
    (uid_alice, 'credit', 90, 190, job1_id, 'seed-alice-credit-job1-' || gen_random_uuid()),
    (uid_alice, 'escrow_lock', 180, 10, job2_id, 'seed-alice-escrow-job2-' || gen_random_uuid());

  -- Bob: starter bonus + escrow for jobs
  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES
    (uid_bob, 'starter_bonus', 100, 100, NULL, 'seed-bob-bonus-' || gen_random_uuid()),
    (uid_bob, 'debit', 100, 0, job1_id, 'seed-bob-debit-job1-' || gen_random_uuid()),
    (uid_bob, 'platform_fee', 10, -10, job1_id, 'seed-bob-fee-job1-' || gen_random_uuid()),
    (uid_bob, 'credit', 500, 490, NULL, 'seed-bob-topup-' || gen_random_uuid()),
    (uid_bob, 'escrow_lock', 200, 290, job2_id, 'seed-bob-escrow-job2-' || gen_random_uuid());

  -- Carol: starter bonus only
  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, idempotency_key)
  VALUES
    (uid_carol, 'starter_bonus', 100, 100, 'seed-carol-bonus-' || gen_random_uuid());

  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Login credentials: alice@example.com / ExamplePass123!';
  RAISE NOTICE '                   bob@example.com / ExamplePass123!';
  RAISE NOTICE '                   carol@example.com / ExamplePass123!';

END $$;
