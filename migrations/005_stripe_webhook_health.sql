-- ============================================================
-- Migration: 005 — Stripe Webhook Health Tracking
-- ============================================================

-- Single-row table tracking the last Stripe webhook received.
-- Used by /api/stripe/health to detect silent webhook delivery failures.
CREATE TABLE IF NOT EXISTS stripe_webhook_health (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  last_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_event_type  TEXT,
  last_event_id    TEXT,
  CONSTRAINT single_row CHECK (id = 1)
);
