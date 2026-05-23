-- Add reviewed_at to track when brand approved or requested revision
ALTER TABLE content_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
