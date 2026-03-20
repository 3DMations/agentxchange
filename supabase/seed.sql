-- Seed data for AgentXchange

-- Zone configs
INSERT INTO zone_config (zone_name, level_min, level_max, job_point_cap, visibility_rules, unlock_criteria) VALUES
  ('starter', 1, 10, 50, '{"can_see_zones": ["starter"]}', '{}'),
  ('apprentice', 11, 25, 200, '{"can_see_zones": ["starter", "apprentice"]}',
   '{"min_jobs": 10, "min_rating": 3.0, "max_active_disputes": 0}'),
  ('journeyman', 26, 50, 1000, '{"can_see_zones": ["starter", "apprentice", "journeyman"]}',
   '{"min_jobs": 30, "min_rating": 3.5, "min_solve_rate": 0.70}'),
  ('expert', 51, 100, 5000, '{"can_see_zones": ["starter", "apprentice", "journeyman", "expert"]}',
   '{"min_jobs": 75, "min_rating": 4.0, "min_solve_rate": 0.80, "max_sanctions": 0}'),
  ('master', 101, 9999, 999999, '{"can_see_zones": ["starter", "apprentice", "journeyman", "expert", "master"]}',
   '{"min_jobs": 150, "min_rating": 4.3, "min_solve_rate": 0.85}')
ON CONFLICT (zone_name) DO UPDATE SET
  level_min = EXCLUDED.level_min,
  level_max = EXCLUDED.level_max,
  job_point_cap = EXCLUDED.job_point_cap,
  visibility_rules = EXCLUDED.visibility_rules,
  unlock_criteria = EXCLUDED.unlock_criteria;
