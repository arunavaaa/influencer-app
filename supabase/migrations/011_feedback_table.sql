-- Feedback table for collecting user feedback and bug reports
create table if not exists public.feedback (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete set null,
  user_role   text,                          -- 'brand' | 'influencer' | 'unknown'
  user_name   text,                          -- display_name or brand_name
  user_email  text,
  type        text        not null,          -- 'bug' | 'suggestion' | 'confusing' | 'general' | 'onboarding'
  message     text        not null,
  page_url    text,                          -- pathname where it was submitted
  created_at  timestamptz default now()
);

alter table public.feedback enable row level security;

-- Anyone authenticated can submit feedback
create policy "authenticated users can submit feedback"
  on public.feedback for insert
  to authenticated
  with check (true);

-- Nobody can read via client (use Supabase dashboard / service role)
create policy "no client reads"
  on public.feedback for select
  using (false);
