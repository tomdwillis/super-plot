-- ============================================================
-- Migration: 008 — Drip Email Queue
-- ============================================================
-- Tracks scheduled drip emails for leads who signed up via
-- the landing page email capture form.
--
-- sequence: 1=Welcome(immediate), 2=Value(day2), 3=SocialProof(day5),
--           4=UpgradeCTA(day7), 5=WilcoLand(day10)
-- status: pending → sent | skipped | failed
-- ============================================================

CREATE TABLE IF NOT EXISTS drip_emails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  sequence      SMALLINT NOT NULL CHECK (sequence BETWEEN 1 AND 5),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the cron job: pending emails due now
CREATE INDEX idx_drip_emails_pending
  ON drip_emails(scheduled_at)
  WHERE status = 'pending';

CREATE INDEX idx_drip_emails_email ON drip_emails(email);

-- Uniqueness: one row per email+sequence (no duplicate sends)
CREATE UNIQUE INDEX idx_drip_emails_email_seq ON drip_emails(email, sequence);
