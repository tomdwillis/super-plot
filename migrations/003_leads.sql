-- ============================================================
-- Migration: 003 — CRM Leads Table
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  phone       TEXT,
  first_name  TEXT,
  last_name   TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip         TEXT,
  county      TEXT,
  apn         TEXT,
  source      TEXT,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'contacted', 'converted')),
  source_crm  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint to deduplicate by email + apn
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_apn
  ON leads(email, apn)
  WHERE apn IS NOT NULL AND apn <> '';

CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_state      ON leads(state);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON leads(created_at DESC);
