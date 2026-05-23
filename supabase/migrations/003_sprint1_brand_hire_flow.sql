-- =========================================
-- Sprint 1: Brand Hire Flow
-- =========================================

-- contracts: brief + escrow fields for direct hire
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS package_id          uuid REFERENCES content_packages(id),
  ADD COLUMN IF NOT EXISTS brief_product       text,
  ADD COLUMN IF NOT EXISTS brief_message       text,
  ADD COLUMN IF NOT EXISTS brief_dos_donts     text,
  ADD COLUMN IF NOT EXISTS brief_golive_date   date,
  ADD COLUMN IF NOT EXISTS escrow_status       text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS razorpay_order_id   text,
  ADD COLUMN IF NOT EXISTS hired_at            timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at         timestamptz,
  ADD COLUMN IF NOT EXISTS auto_approve_at     timestamptz;

-- influencer_profiles: portfolio, audience demographics, faq, title
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS portfolio_urls       text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_title        text,
  ADD COLUMN IF NOT EXISTS audience_india_pct   int,
  ADD COLUMN IF NOT EXISTS audience_gender_male_pct   int,
  ADD COLUMN IF NOT EXISTS audience_age_18_24_pct     int,
  ADD COLUMN IF NOT EXISTS audience_age_25_34_pct     int,
  ADD COLUMN IF NOT EXISTS audience_age_35_44_pct     int,
  ADD COLUMN IF NOT EXISTS faq                  jsonb     DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ig_verified          boolean   DEFAULT false,
  ADD COLUMN IF NOT EXISTS ig_verified_at       timestamptz;

-- RLS: brands can insert contracts for direct hire
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contracts'
      AND policyname = 'brand can create direct hire contract'
  ) THEN
    CREATE POLICY "brand can create direct hire contract" ON contracts
      FOR INSERT
      WITH CHECK (
        brand_id IN (
          SELECT id FROM brand_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS: brands can read their own contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contracts'
      AND policyname = 'brand can read own contracts'
  ) THEN
    CREATE POLICY "brand can read own contracts" ON contracts
      FOR SELECT
      USING (
        brand_id IN (
          SELECT id FROM brand_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS: brands can update status on their contracts (approve/revision)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contracts'
      AND policyname = 'brand can update own contract status'
  ) THEN
    CREATE POLICY "brand can update own contract status" ON contracts
      FOR UPDATE
      USING (
        brand_id IN (
          SELECT id FROM brand_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
