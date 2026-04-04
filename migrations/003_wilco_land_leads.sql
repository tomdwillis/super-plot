-- ============================================================
-- Migration: 003 — Wilco Land Leads Schema
-- ============================================================
-- Stores lead data from the "Get an Instant Offer from Wilco Land"
-- CTA displayed in property reports after the valuation section.
--
-- Design notes:
--   • parcel_apn and report_order_id link back to the report context
--     so Wilco Land can look up full valuation data.
--   • contact info (name, email, phone) is stored flat for easy export.
--   • valuation_snapshot (JSONB) captures the valuation at submission
--     time for audit and lead quality scoring.
--   • status tracks the lifecycle of the lead:
--       new       → submitted, not yet reviewed
--       contacted → Wilco Land has reached out
--       closed    → deal closed or lead expired
-- ============================================================

CREATE TABLE IF NOT EXISTS wilco_land_leads (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report context (optional — user may submit without an active report order)
  report_order_id       UUID        REFERENCES report_orders(id) ON DELETE SET NULL,

  -- Parcel identifier from the report
  parcel_apn            TEXT,

  -- Contact info collected from the CTA form
  contact_name          TEXT        NOT NULL,
  contact_email         TEXT        NOT NULL,
  contact_phone         TEXT        NOT NULL,

  -- Snapshot of valuation data at submission time for lead quality context
  valuation_snapshot    JSONB,

  -- Lifecycle status of this lead
  status                TEXT        NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new', 'contacted', 'closed')),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Look up all leads for a given report order
CREATE INDEX idx_wilco_land_leads_report_order
  ON wilco_land_leads(report_order_id);

-- Filter by email for dedup and CRM lookup
CREATE INDEX idx_wilco_land_leads_email
  ON wilco_land_leads(contact_email);

-- Filter by lifecycle status (e.g. new leads queue for outreach)
CREATE INDEX idx_wilco_land_leads_status
  ON wilco_land_leads(status);

-- Keep updated_at current automatically (reuses function from migration 002)
CREATE TRIGGER trg_wilco_land_leads_updated_at
  BEFORE UPDATE ON wilco_land_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
