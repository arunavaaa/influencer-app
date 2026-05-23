-- =========================================
-- Sprint 3: Creator Order Flow
-- =========================================

-- content_submissions: creator uploads content for brand review
CREATE TABLE IF NOT EXISTS content_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id      uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  content_url      text NOT NULL DEFAULT '',
  notes            text,
  revision_notes   text,
  status           text NOT NULL DEFAULT 'pending_review',
    -- pending_review | approved | revision_requested
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup per contract
CREATE INDEX IF NOT EXISTS idx_content_submissions_contract
  ON content_submissions(contract_id);

-- RLS
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;

-- Creator can insert their own submissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_submissions'
      AND policyname = 'creator can insert own submissions'
  ) THEN
    CREATE POLICY "creator can insert own submissions" ON content_submissions
      FOR INSERT
      WITH CHECK (
        contract_id IN (
          SELECT c.id FROM contracts c
          JOIN influencer_profiles ip ON ip.id = c.influencer_id
          WHERE ip.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Creator can read their own submissions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_submissions'
      AND policyname = 'creator can read own submissions'
  ) THEN
    CREATE POLICY "creator can read own submissions" ON content_submissions
      FOR SELECT
      USING (
        contract_id IN (
          SELECT c.id FROM contracts c
          JOIN influencer_profiles ip ON ip.id = c.influencer_id
          WHERE ip.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Brand can read submissions for their contracts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_submissions'
      AND policyname = 'brand can read submissions for own contracts'
  ) THEN
    CREATE POLICY "brand can read submissions for own contracts" ON content_submissions
      FOR SELECT
      USING (
        contract_id IN (
          SELECT c.id FROM contracts c
          JOIN brand_profiles bp ON bp.id = c.brand_id
          WHERE bp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Brand can update submission status (approve / request revision)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_submissions'
      AND policyname = 'brand can update submission status'
  ) THEN
    CREATE POLICY "brand can update submission status" ON content_submissions
      FOR UPDATE
      USING (
        contract_id IN (
          SELECT c.id FROM contracts c
          JOIN brand_profiles bp ON bp.id = c.brand_id
          WHERE bp.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- contracts: add influencer_id column if it doesn't already exist
-- (needed for creator-side queries — was likely created during initial schema)
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS influencer_id uuid REFERENCES influencer_profiles(id);
