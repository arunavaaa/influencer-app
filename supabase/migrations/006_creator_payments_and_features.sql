-- =========================================
-- Migration 006: Creator Payments & Features
-- =========================================

-- UPI / bank payout details on influencer_profiles
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS upi_id            text,
  ADD COLUMN IF NOT EXISTS bank_account_name text,
  ADD COLUMN IF NOT EXISTS bank_account_no   text,
  ADD COLUMN IF NOT EXISTS bank_ifsc         text,
  ADD COLUMN IF NOT EXISTS bank_name         text;

-- Counter-offer support on contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS counter_price_inr int,
  ADD COLUMN IF NOT EXISTS counter_note      text,
  ADD COLUMN IF NOT EXISTS countered_at      timestamptz;

-- Ensure influencer can update their own contract (for accepting / counter-offering)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contracts'
      AND policyname = 'influencer can update own contract'
  ) THEN
    CREATE POLICY "influencer can update own contract" ON contracts
      FOR UPDATE
      USING (
        influencer_id IN (
          SELECT id FROM influencer_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Ensure influencer can read their own contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contracts'
      AND policyname = 'influencer can read own contracts'
  ) THEN
    CREATE POLICY "influencer can read own contracts" ON contracts
      FOR SELECT
      USING (
        influencer_id IN (
          SELECT id FROM influencer_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Ensure influencer can update their own profile (for UPI save)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'influencer_profiles'
      AND policyname = 'influencer can update own profile'
  ) THEN
    CREATE POLICY "influencer can update own profile" ON influencer_profiles
      FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Ensure notifications are insertable by service role / triggers
-- (already exists from migration 001 but add insert policy for auth users too)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
      AND policyname = 'user can insert own notifications'
  ) THEN
    CREATE POLICY "user can insert own notifications" ON notifications
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
