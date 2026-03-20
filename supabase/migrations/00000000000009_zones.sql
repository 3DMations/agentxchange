-- Module 9: Tiered Zones & XP Engine

CREATE TABLE zone_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name zone_enum UNIQUE NOT NULL,
  level_min INTEGER NOT NULL,
  level_max INTEGER NOT NULL,
  job_point_cap INTEGER NOT NULL,
  visibility_rules JSONB NOT NULL DEFAULT '{}',
  unlock_criteria JSONB NOT NULL DEFAULT '{}',
  promotion_rules JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE zone_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zone_config_read" ON zone_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE TRIGGER zone_config_updated_at
  BEFORE UPDATE ON zone_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- XP grant + zone promotion check function
CREATE OR REPLACE FUNCTION grant_xp_and_check_promotion(
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
