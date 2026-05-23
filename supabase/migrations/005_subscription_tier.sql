-- Add subscription tier to brand profiles
-- Defaults to 'free'; set to 'pro' or 'scale' when a brand upgrades.

alter table brand_profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'scale'));
