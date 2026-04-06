-- ============================================================
-- Migration: 007 — Fix tier CHECK constraint
-- The original constraint allowed ('free', 'basic', 'professional', 'premium')
-- but the application uses ('free', 'standard', 'premium').
-- This caused "Failed to create checkout session" for paid orders.
-- ============================================================

-- 1. Drop the old constraint
ALTER TABLE report_orders DROP CONSTRAINT IF EXISTS report_orders_tier_check;

-- 2. Update any existing rows that used the old tier names
UPDATE report_orders SET tier = 'standard' WHERE tier IN ('basic', 'professional');

-- 3. Add the corrected constraint
ALTER TABLE report_orders ADD CONSTRAINT report_orders_tier_check
  CHECK (tier IN ('free', 'standard', 'premium'));
