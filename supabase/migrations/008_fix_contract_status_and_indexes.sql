-- =========================================
-- Migration 008: Fix contract status column
-- =========================================
-- The contracts.status column was a 4-value enum (pending/active/completed/disputed).
-- The app needs a richer text-based status flow. Convert to text and remap values.

-- 1. Drop the default so the ALTER TYPE can proceed cleanly
ALTER TABLE contracts ALTER COLUMN status DROP DEFAULT;

-- 2. Convert from enum to text (keeps existing values as strings)
ALTER TABLE contracts ALTER COLUMN status TYPE text USING status::text;

-- 3. Set new default
ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'pending_acceptance';

-- 4. Map old enum values → new status names
UPDATE contracts SET status = CASE status
  WHEN 'pending'   THEN 'pending_acceptance'
  WHEN 'active'    THEN 'accepted'
  WHEN 'completed' THEN 'approved'
  ELSE status   -- 'disputed' stays as-is; anything already using new names stays too
END;

-- 5. Indexes for fast order-list queries
CREATE INDEX IF NOT EXISTS idx_contracts_influencer_id
  ON contracts(influencer_id);

CREATE INDEX IF NOT EXISTS idx_contracts_brand_id
  ON contracts(brand_id);

CREATE INDEX IF NOT EXISTS idx_contracts_hired_at
  ON contracts(hired_at DESC NULLS LAST);
