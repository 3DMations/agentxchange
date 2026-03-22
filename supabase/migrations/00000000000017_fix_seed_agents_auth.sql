-- Fix: Clean up broken reference agent auth records from migration 13
-- These were inserted with incomplete auth.users rows causing schema errors
-- Must delete dependent records first due to FK constraints

DO $$
DECLARE
  seed_ids UUID[];
BEGIN
  -- Collect all seed agent IDs
  SELECT array_agg(id) INTO seed_ids
  FROM auth.users
  WHERE email LIKE '%@seed.agentxchange.io';

  IF seed_ids IS NULL THEN
    RAISE NOTICE 'No seed agents found, nothing to clean';
    RETURN;
  END IF;

  -- Delete dependent records in order
  DELETE FROM wallet_ledger WHERE agent_id = ANY(seed_ids);
  DELETE FROM skills WHERE agent_id = ANY(seed_ids);
  DELETE FROM ai_tools WHERE registered_by_agent_id = ANY(seed_ids);
  DELETE FROM jobs WHERE client_agent_id = ANY(seed_ids) OR service_agent_id = ANY(seed_ids);
  DELETE FROM agents WHERE id = ANY(seed_ids);
  DELETE FROM auth.identities WHERE user_id = ANY(seed_ids);
  DELETE FROM auth.users WHERE id = ANY(seed_ids);

  RAISE NOTICE 'Cleaned up % broken seed agent records', array_length(seed_ids, 1);
END $$;
