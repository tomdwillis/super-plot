-- ============================================================
-- Migration: 001 — Super Plot Portal Schema
-- ============================================================

-- Report orders from the self-serve portal.
-- Separate from the pipeline's `reports` table; linked by parcel_input
-- until the pipeline resolves to a parcel_id.
CREATE TABLE IF NOT EXISTS report_orders (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT NOT NULL,
  tier                      TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'professional', 'premium')),
  parcel_input              TEXT NOT NULL,
  input_type                TEXT NOT NULL CHECK (input_type IN ('apn', 'address')),
  status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  title                     TEXT,
  pdf_url                   TEXT,
  price_cents               INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id  TEXT,
  stripe_session_id         TEXT UNIQUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_orders_email    ON report_orders(email);
CREATE INDEX idx_report_orders_status   ON report_orders(status);
CREATE INDEX idx_report_orders_created  ON report_orders(created_at DESC);

-- Email captures from the landing page CTA.
CREATE TABLE IF NOT EXISTS email_captures (
  email       TEXT PRIMARY KEY,
  source      TEXT DEFAULT 'landing_page',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
