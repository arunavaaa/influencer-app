-- =========================================
-- Sprint: Persona Gap Features
-- =========================================

-- Brand GST number — visible to creators on incoming offers (Vikram persona)
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS gst_number text;

-- Top audience state — regional creators (Karthik Tamil Nadu persona)
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS audience_top_state text;

-- UGC usage rights duration in months (Divya UGC persona)
ALTER TABLE content_packages
  ADD COLUMN IF NOT EXISTS usage_rights_months int;
