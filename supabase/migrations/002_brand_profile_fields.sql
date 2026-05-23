-- Add new brand profile fields for onboarding v2
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS company_description  TEXT,
  ADD COLUMN IF NOT EXISTS company_city         TEXT,
  ADD COLUMN IF NOT EXISTS cover_url            TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle     TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url         TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_goal      TEXT,
  ADD COLUMN IF NOT EXISTS business_type        TEXT,
  ADD COLUMN IF NOT EXISTS preferred_platforms  TEXT[],
  ADD COLUMN IF NOT EXISTS interested_categories TEXT[],
  ADD COLUMN IF NOT EXISTS company_size         TEXT,
  ADD COLUMN IF NOT EXISTS monthly_budget       TEXT;
