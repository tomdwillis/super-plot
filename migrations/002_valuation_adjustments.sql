-- ============================================================
-- Migration: 002 — Valuation Adjustments Schema
-- ============================================================
-- Stores user-submitted property characteristic adjustments
-- associated with a valuation challenge on a report_order.
--
-- Design notes:
--   • Structured columns for each adjustment field enable
--     efficient filtering and reporting without JSON parsing.
--   • raw_payload (JSONB) stores the full submitted payload for
--     audit purposes and future extensibility.
--   • status tracks the lifecycle of the challenge:
--       pending  → adjustment submitted, awaiting review
--       accepted → adjustment approved and incorporated
--       rejected → adjustment reviewed and declined
--       applied  → adjustment has been applied to the valuation
-- ============================================================

CREATE TABLE IF NOT EXISTS valuation_adjustments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the report order being challenged (required)
  report_order_id   UUID        NOT NULL
                    REFERENCES report_orders(id) ON DELETE CASCADE,

  -- Septic system status: pass | fail | unknown
  septic            TEXT        CHECK (septic IN ('pass', 'fail', 'unknown')),

  -- Road access quality: 1 (paved) → 5 (landlocked)
  road_access       SMALLINT    CHECK (road_access BETWEEN 1 AND 5),

  -- Wetlands coverage percentage bucket: 0, 10, 25, or 50
  wetlands_pct      SMALLINT    CHECK (wetlands_pct IN (0, 10, 25, 50)),

  -- Utility availability flags
  utility_electric  BOOLEAN,
  utility_water     BOOLEAN,
  utility_sewer     BOOLEAN,
  utility_gas       BOOLEAN,

  -- Topography/buildability score: 1 (flat) → 5 (steep/difficult)
  topography        SMALLINT    CHECK (topography BETWEEN 1 AND 5),

  -- Zoning confidence: true = confirmed with county, false = assumed
  zoning_confirmed  BOOLEAN,

  -- Flood zone membership: in | out | partial
  flood_zone        TEXT        CHECK (flood_zone IN ('in', 'out', 'partial')),

  -- Timber and mineral value known to user
  timber_known      BOOLEAN,
  minerals_known    BOOLEAN,

  -- Free-text notes from the user (max 2 000 chars enforced at app layer)
  notes             TEXT,

  -- Full payload for audit trail and future extensibility
  raw_payload       JSONB       NOT NULL,

  -- Lifecycle status of this adjustment challenge
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected', 'applied')),

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lookup all adjustments for a given report order
CREATE INDEX idx_valuation_adjustments_order
  ON valuation_adjustments(report_order_id);

-- Filter by lifecycle status (e.g. pending queue for review)
CREATE INDEX idx_valuation_adjustments_status
  ON valuation_adjustments(status);

-- Index the JSONB payload for ad-hoc queries
CREATE INDEX idx_valuation_adjustments_raw
  ON valuation_adjustments USING gin(raw_payload);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_valuation_adjustments_updated_at
  BEFORE UPDATE ON valuation_adjustments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
