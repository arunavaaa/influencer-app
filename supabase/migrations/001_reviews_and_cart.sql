-- =========================================
-- Task 8: Reviews table
-- =========================================
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  contract_id uuid references contracts(id),
  reviewer_id uuid references auth.users(id),
  influencer_id uuid references influencer_profiles(id),
  rating_overall int check (rating_overall >= 1 and rating_overall <= 5),
  rating_communication int check (rating_communication >= 1 and rating_communication <= 5),
  rating_timeliness int check (rating_timeliness >= 1 and rating_timeliness <= 5),
  rating_satisfaction int check (rating_satisfaction >= 1 and rating_satisfaction <= 5),
  text text,
  created_at timestamptz default now()
);

alter table reviews enable row level security;

-- Brands can insert reviews for contracts they own
create policy "brands can insert reviews" on reviews
  for insert
  with check (reviewer_id = auth.uid());

-- Anyone can read reviews
create policy "reviews are readable by all" on reviews
  for select
  using (true);

-- Reviewer can update their own review
create policy "reviewer can update own review" on reviews
  for update
  using (reviewer_id = auth.uid());

-- =========================================
-- Task 9: Cart items table
-- =========================================
create table if not exists cart_items (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brand_profiles(id) on delete cascade,
  influencer_id uuid references influencer_profiles(id),
  package_id uuid references content_packages(id),
  created_at timestamptz default now()
);

alter table cart_items enable row level security;

create policy "brand can manage own cart" on cart_items
  for all
  using (
    brand_id in (
      select id from brand_profiles where user_id = auth.uid()
    )
  );

-- =========================================
-- Task 11: Tracked posts table
-- =========================================
create table if not exists tracked_posts (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brand_profiles(id) on delete cascade,
  campaign_id uuid references campaigns(id),
  influencer_id uuid references influencer_profiles(id),
  post_url text not null,
  platform text,
  views int default 0,
  likes int default 0,
  comments int default 0,
  engagement_rate float default 0,
  tracked_at timestamptz default now()
);

alter table tracked_posts enable row level security;

create policy "brand can manage own tracked posts" on tracked_posts
  for all
  using (
    brand_id in (
      select id from brand_profiles where user_id = auth.uid()
    )
  );

-- =========================================
-- Task 12: Saved lists tables
-- =========================================
create table if not exists saved_lists (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brand_profiles(id) on delete cascade,
  name text default 'My List',
  created_at timestamptz default now()
);

alter table saved_lists enable row level security;

create policy "brand can manage own saved lists" on saved_lists
  for all
  using (
    brand_id in (
      select id from brand_profiles where user_id = auth.uid()
    )
  );

create table if not exists saved_list_items (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references saved_lists(id) on delete cascade,
  influencer_id uuid references influencer_profiles(id)
);

alter table saved_list_items enable row level security;

create policy "brand can manage own saved list items" on saved_list_items
  for all
  using (
    list_id in (
      select sl.id from saved_lists sl
      join brand_profiles bp on bp.id = sl.brand_id
      where bp.user_id = auth.uid()
    )
  );

-- =========================================
-- Task 13: Notifications table
-- =========================================
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "user can manage own notifications" on notifications
  for all
  using (user_id = auth.uid());

-- =========================================
-- Task 14: Referrals table
-- =========================================
create table if not exists referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references auth.users(id),
  referred_user_id uuid references auth.users(id),
  status text default 'pending',
  reward_inr int default 500,
  created_at timestamptz default now()
);

alter table referrals enable row level security;

create policy "user can see own referrals" on referrals
  for select
  using (referrer_id = auth.uid() or referred_user_id = auth.uid());

create policy "system can insert referrals" on referrals
  for insert
  with check (true);

-- =========================================
-- Task 16: Brand onboarding columns
-- =========================================
alter table brand_profiles
  add column if not exists onboarding_goal text,
  add column if not exists business_type text,
  add column if not exists preferred_platforms text[],
  add column if not exists company_size text,
  add column if not exists monthly_budget text;
