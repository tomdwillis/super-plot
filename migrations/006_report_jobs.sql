-- ============================================================
-- Migration: 006 — Report Jobs Queue
-- ============================================================
-- DB-backed job queue for async report processing.
-- Each job tracks its stage progression through the pipeline.

-- Add enrichment-related statuses to report_orders
ALTER TABLE report_orders DROP CONSTRAINT IF EXISTS report_orders_status_check;
ALTER TABLE report_orders ADD CONSTRAINT report_orders_status_check
  CHECK (status IN ('pending', 'enriching', 'generating', 'ready', 'failed'));

CREATE TABLE IF NOT EXISTS report_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_order_id UUID NOT NULL REFERENCES report_orders(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retry')),
  stage           TEXT NOT NULL DEFAULT 'parcel_lookup'
                    CHECK (stage IN (
                      'parcel_lookup', 'environmental', 'market_data',
                      'valuation', 'report_assembly', 'pdf_generation'
                    )),
  stage_data      JSONB DEFAULT '{}',
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  error           TEXT,
  locked_at       TIMESTAMPTZ,
  locked_by       TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_jobs_status ON report_jobs(status, scheduled_at);
CREATE INDEX idx_report_jobs_order  ON report_jobs(report_order_id);
CREATE INDEX idx_report_jobs_locked ON report_jobs(locked_at) WHERE locked_at IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER trg_report_jobs_updated_at
  BEFORE UPDATE ON report_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
