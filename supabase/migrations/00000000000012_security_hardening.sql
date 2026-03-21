-- Migration 12: Security Hardening
-- Adds missing RLS policies, input validation on RPC functions, and performance indexes.
-- This migration is additive-only (no column renames or deletes).

-- ============================================================
-- 1. Missing RLS Policies
-- ============================================================

-- disputes: UPDATE policy so assigned moderators/admins can resolve disputes
CREATE POLICY "disputes_update_assigned" ON disputes FOR UPDATE
  USING (assigned_to = auth.uid() OR EXISTS (
    SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- deliverables: UPDATE policy so the submitting agent can update (e.g. safety scan results)
CREATE POLICY "deliverables_update_owner" ON deliverables FOR UPDATE
  USING (agent_id = auth.uid());

-- zone_config: UPDATE policy restricted to admins only
CREATE POLICY "zone_config_update_admin" ON zone_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM agents WHERE id = auth.uid() AND role = 'admin'));

-- sanctions: INSERT policy for moderators/admins
CREATE POLICY "sanctions_insert_mod" ON sanctions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- sanctions: UPDATE policy for moderators/admins
CREATE POLICY "sanctions_update_mod" ON sanctions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM agents WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- ============================================================
-- 2. RPC Input Validation
-- Re-create SECURITY DEFINER functions with validation guards.
-- We DROP then CREATE (not CREATE OR REPLACE) because these are
-- SECURITY DEFINER and we want a clean re-definition.
-- ============================================================

-- 2a. wallet_escrow_lock — validate amount, agent_id, job_id, idempotency_key
DROP FUNCTION IF EXISTS wallet_escrow_lock(UUID, UUID, INTEGER, TEXT) CASCADE;

CREATE FUNCTION wallet_escrow_lock(
  p_client_agent_id UUID,
  p_job_id UUID,
  p_amount INTEGER,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Input validation
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: amount must be greater than zero';
  END IF;
  IF p_client_agent_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: agent_id is required';
  END IF;
  IF p_job_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: job_id is required';
  END IF;
  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: idempotency_key is required';
  END IF;

  -- Idempotency check
  SELECT * INTO v_existing FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_processed', 'ledger_id', v_existing.id);
  END IF;

  -- Lock all rows for this agent first, then compute balance
  PERFORM 1 FROM wallet_ledger
  WHERE agent_id = p_client_agent_id
  FOR UPDATE;

  SELECT COALESCE(SUM(CASE
    WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
    WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
    ELSE 0
  END), 0)
  INTO v_balance
  FROM wallet_ledger
  WHERE agent_id = p_client_agent_id;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: balance=%, required=%', v_balance, p_amount;
  END IF;

  v_new_balance := v_balance - p_amount;

  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES (p_client_agent_id, 'escrow_lock', p_amount, v_new_balance, p_job_id, p_idempotency_key);

  RETURN jsonb_build_object('status', 'locked', 'new_balance', v_new_balance);
END;
$$;

-- 2b. wallet_escrow_release — validate job_id and platform_fee_pct range
DROP FUNCTION IF EXISTS wallet_escrow_release(UUID, UUID, INTEGER, TEXT) CASCADE;

CREATE FUNCTION wallet_escrow_release(
  p_job_id UUID,
  p_service_agent_id UUID,
  p_platform_fee_pct INTEGER,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_escrow_entry RECORD;
  v_fee INTEGER;
  v_payout INTEGER;
  v_service_balance INTEGER;
BEGIN
  -- Input validation
  IF p_job_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: job_id is required';
  END IF;
  IF p_platform_fee_pct < 0 OR p_platform_fee_pct > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT: platform_fee_pct must be between 0 and 100';
  END IF;

  -- Idempotency check
  SELECT * INTO v_existing FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_processed', 'ledger_id', v_existing.id);
  END IF;

  -- Find the escrow lock entry for this job
  SELECT * INTO v_escrow_entry FROM wallet_ledger
  WHERE job_id = p_job_id AND type = 'escrow_lock'
  ORDER BY created_at DESC LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_ESCROW_FOUND: job_id=%', p_job_id;
  END IF;

  v_fee := (v_escrow_entry.amount * p_platform_fee_pct) / 100;
  v_payout := v_escrow_entry.amount - v_fee;

  -- Get service agent's current balance
  SELECT COALESCE(SUM(CASE
    WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
    WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
    ELSE 0
  END), 0)
  INTO v_service_balance
  FROM wallet_ledger
  WHERE agent_id = p_service_agent_id;

  -- Credit service agent
  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES (p_service_agent_id, 'escrow_release', v_payout, v_service_balance + v_payout, p_job_id, p_idempotency_key || '_release');

  -- Record platform fee
  IF v_fee > 0 THEN
    INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
    VALUES (v_escrow_entry.agent_id, 'platform_fee', v_fee, v_escrow_entry.balance_after, p_job_id, p_idempotency_key || '_fee');
  END IF;

  RETURN jsonb_build_object('status', 'released', 'payout', v_payout, 'fee', v_fee);
END;
$$;

-- 2c. wallet_refund — validate job_id
DROP FUNCTION IF EXISTS wallet_refund(UUID, TEXT) CASCADE;

CREATE FUNCTION wallet_refund(
  p_job_id UUID,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_escrow_entry RECORD;
  v_client_balance INTEGER;
BEGIN
  -- Input validation
  IF p_job_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: job_id is required';
  END IF;

  -- Idempotency check
  SELECT * INTO v_existing FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_processed', 'ledger_id', v_existing.id);
  END IF;

  -- Find the escrow lock
  SELECT * INTO v_escrow_entry FROM wallet_ledger
  WHERE job_id = p_job_id AND type = 'escrow_lock'
  ORDER BY created_at DESC LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_ESCROW_FOUND: job_id=%', p_job_id;
  END IF;

  -- Get client's current balance
  SELECT COALESCE(SUM(CASE
    WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
    WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
    ELSE 0
  END), 0)
  INTO v_client_balance
  FROM wallet_ledger
  WHERE agent_id = v_escrow_entry.agent_id;

  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, job_id, idempotency_key)
  VALUES (v_escrow_entry.agent_id, 'refund', v_escrow_entry.amount, v_client_balance + v_escrow_entry.amount, p_job_id, p_idempotency_key);

  RETURN jsonb_build_object('status', 'refunded', 'amount', v_escrow_entry.amount);
END;
$$;

-- 2d. wallet_grant_starter_bonus — validate amount > 0
DROP FUNCTION IF EXISTS wallet_grant_starter_bonus(UUID, INTEGER, TEXT) CASCADE;

CREATE FUNCTION wallet_grant_starter_bonus(
  p_agent_id UUID,
  p_amount INTEGER,
  p_idempotency_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_balance INTEGER;
BEGIN
  -- Input validation
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: amount must be greater than zero';
  END IF;

  SELECT * INTO v_existing FROM wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object('status', 'already_processed', 'ledger_id', v_existing.id);
  END IF;

  SELECT COALESCE(SUM(CASE
    WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
    WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
    ELSE 0
  END), 0)
  INTO v_balance
  FROM wallet_ledger
  WHERE agent_id = p_agent_id;

  INSERT INTO wallet_ledger (agent_id, type, amount, balance_after, idempotency_key)
  VALUES (p_agent_id, 'starter_bonus', p_amount, v_balance + p_amount, p_idempotency_key);

  RETURN jsonb_build_object('status', 'granted', 'new_balance', v_balance + p_amount);
END;
$$;

-- 2e. grant_xp_and_check_promotion — validate base_xp, rating, agent_id
DROP FUNCTION IF EXISTS grant_xp_and_check_promotion(UUID, INTEGER, INTEGER, BOOLEAN) CASCADE;

CREATE FUNCTION grant_xp_and_check_promotion(
  p_agent_id UUID,
  p_base_xp INTEGER,
  p_rating INTEGER,
  p_solved BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent RECORD;
  v_bonus_xp INTEGER := 0;
  v_total_xp INTEGER;
  v_new_level INTEGER;
  v_new_zone zone_enum;
  v_promoted BOOLEAN := false;
BEGIN
  -- Input validation
  IF p_base_xp < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: base_xp must be non-negative';
  END IF;
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'INVALID_INPUT: rating must be between 1 and 5';
  END IF;
  IF p_agent_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: agent_id is required';
  END IF;

  SELECT * INTO v_agent FROM agents WHERE id = p_agent_id FOR UPDATE;

  -- Rating bonus/penalty
  IF p_rating >= 4 THEN v_bonus_xp := (p_base_xp * 25) / 100;
  ELSIF p_rating <= 2 THEN v_bonus_xp := -((p_base_xp * 15) / 100);
  END IF;

  -- Solve rate multiplier
  IF v_agent.solve_rate > 0.75 THEN
    v_bonus_xp := v_bonus_xp + ((p_base_xp * 20) / 100);
  END IF;

  v_total_xp := v_agent.total_xp + p_base_xp + v_bonus_xp;
  v_new_level := 1 + (v_total_xp / 100);

  -- Check zone promotion
  v_new_zone := v_agent.zone;
  IF v_new_level > (SELECT level_max FROM zone_config WHERE zone_name = v_agent.zone) THEN
    SELECT zone_name INTO v_new_zone FROM zone_config
    WHERE level_min <= v_new_level
    AND zone_name != v_agent.zone
    ORDER BY level_min DESC LIMIT 1;

    IF v_new_zone IS NOT NULL AND v_new_zone != v_agent.zone THEN
      v_promoted := true;
    ELSE
      v_new_zone := v_agent.zone;
    END IF;
  END IF;

  UPDATE agents SET
    total_xp = v_total_xp,
    level = v_new_level,
    zone = COALESCE(v_new_zone, v_agent.zone)
  WHERE id = p_agent_id;

  RETURN jsonb_build_object(
    'xp_gained', p_base_xp + v_bonus_xp,
    'total_xp', v_total_xp,
    'new_level', v_new_level,
    'zone', v_new_zone,
    'promoted', v_promoted
  );
END;
$$;

-- ============================================================
-- 3. Missing Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS disputes_priority_idx ON disputes (priority);
CREATE INDEX IF NOT EXISTS webhook_event_subscription_idx ON webhook_event_log (subscription_id);
CREATE INDEX IF NOT EXISTS agents_suspension_status_idx ON agents (suspension_status);
CREATE INDEX IF NOT EXISTS wallet_agent_type_idx ON wallet_ledger (agent_id, type);
