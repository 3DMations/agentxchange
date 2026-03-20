-- Module 7: Wallet & Settlement

CREATE TYPE ledger_type AS ENUM (
  'credit', 'debit', 'escrow_lock', 'escrow_release',
  'refund', 'platform_fee', 'starter_bonus'
);

CREATE TABLE wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  type ledger_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_after INTEGER NOT NULL,
  job_id UUID,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX wallet_agent_idx ON wallet_ledger (agent_id);
CREATE INDEX wallet_idempotency_idx ON wallet_ledger (idempotency_key);
CREATE INDEX wallet_job_idx ON wallet_ledger (job_id);
CREATE INDEX wallet_created_at_idx ON wallet_ledger (created_at);

ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Agents can only read their own ledger
CREATE POLICY "wallet_read_own" ON wallet_ledger FOR SELECT
  USING (agent_id = auth.uid());

-- Block direct inserts; only RPC functions can write
CREATE POLICY "wallet_no_direct_insert" ON wallet_ledger FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- PostgreSQL Functions (SECURITY DEFINER — bypass RLS)
-- ============================================================

-- Get wallet balance
CREATE OR REPLACE FUNCTION wallet_get_balance(p_agent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
  v_escrowed INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(CASE
      WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
      WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
      ELSE 0
    END), 0),
    COALESCE(SUM(CASE
      WHEN type = 'escrow_lock' THEN amount
      WHEN type IN ('escrow_release', 'refund') THEN -amount
      ELSE 0
    END), 0)
  INTO v_available, v_escrowed
  FROM wallet_ledger
  WHERE agent_id = p_agent_id;

  -- Escrowed can't be negative
  IF v_escrowed < 0 THEN v_escrowed := 0; END IF;

  RETURN jsonb_build_object(
    'available', v_available,
    'escrowed', v_escrowed,
    'total', v_available + v_escrowed
  );
END;
$$;

-- Escrow lock
CREATE OR REPLACE FUNCTION wallet_escrow_lock(
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

-- Escrow release (pay service agent, take platform fee)
CREATE OR REPLACE FUNCTION wallet_escrow_release(
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

-- Refund escrowed points to client
CREATE OR REPLACE FUNCTION wallet_refund(
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

-- Grant starter bonus
CREATE OR REPLACE FUNCTION wallet_grant_starter_bonus(
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

-- Reconciliation check
CREATE OR REPLACE FUNCTION wallet_reconciliation_check()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_credits BIGINT;
  v_total_debits BIGINT;
  v_discrepancies JSONB;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type IN ('credit', 'starter_bonus') THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type IN ('platform_fee') THEN amount ELSE 0 END), 0)
  INTO v_total_credits, v_total_debits
  FROM wallet_ledger;

  -- Find agents with negative balances (should never happen)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('agent_id', agent_id, 'balance', balance)), '[]'::jsonb)
  INTO v_discrepancies
  FROM (
    SELECT agent_id, SUM(CASE
      WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
      WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
      ELSE 0
    END) as balance
    FROM wallet_ledger
    GROUP BY agent_id
    HAVING SUM(CASE
      WHEN type IN ('credit', 'escrow_release', 'refund', 'starter_bonus') THEN amount
      WHEN type IN ('debit', 'escrow_lock', 'platform_fee') THEN -amount
      ELSE 0
    END) < 0
  ) sub;

  RETURN jsonb_build_object(
    'total_credits', v_total_credits,
    'total_fees', v_total_debits,
    'negative_balance_agents', v_discrepancies,
    'checked_at', now()
  );
END;
$$;
