import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Only callable in development
// POST /api/seed-creators  →  creates 10 demo creators + their content packages

const CREATORS = [
  {
    email: 'priya.sharma@demo.crayon.dev',
    display_name: 'Priya Sharma',
    profile_title: 'Fashion & Lifestyle Creator',
    bio: "Documenting everyday style from Mumbai. I believe fashion is for everyone — not just runways. Partnered with 50+ brands across fashion, skincare, and home décor.",
    city: 'Mumbai',
    niche: ['Fashion', 'Lifestyle', 'Beauty'],
    language: ['Hindi', 'English'],
    followers_instagram: 142000,
    engagement_rate_instagram: 4.2,
    reputation_score: 92,
    audience_india_pct: 87,
    audience_gender_male_pct: 22,
    audience_age_18_24_pct: 38,
    audience_age_25_34_pct: 44,
    audience_age_35_44_pct: 12,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 18000, delivery_days: 5, revisions: 2, description: '30–60 sec Reel with branded hook, storytelling, and CTA. Includes script ideation.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 7000, delivery_days: 3, revisions: 1, description: '3 Instagram Stories — swipe-up link, poll or sticker engagement.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 12000, delivery_days: 5, revisions: 2, description: '5–8 slide carousel with educational or styling content around your product.' },
    ],
  },
  {
    email: 'rohan.verma@demo.crayon.dev',
    display_name: 'Rohan Verma',
    profile_title: 'Tech Reviewer & Gadget Unboxer',
    bio: "Deep-diving into every gadget that lands on my desk. Honest reviews, no fluff. 6 years of tech content from Delhi. If it charges, connects, or computes — I review it.",
    city: 'Delhi',
    niche: ['Tech', 'Gaming'],
    language: ['Hindi', 'English'],
    followers_instagram: 89000,
    engagement_rate_instagram: 5.8,
    reputation_score: 88,
    audience_india_pct: 91,
    audience_gender_male_pct: 78,
    audience_age_18_24_pct: 45,
    audience_age_25_34_pct: 38,
    audience_age_35_44_pct: 10,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 14000, delivery_days: 7, revisions: 2, description: '60–90 sec product unboxing/review Reel with feature highlights and verdict.' },
      { platform: 'YouTube', format: 'Dedicated Video', price_inr: 35000, delivery_days: 10, revisions: 1, description: '8–12 min dedicated review video. End-screen & pinned comment with your link.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 5000, delivery_days: 3, revisions: 1, description: 'Product mention + specs highlight across 3 stories.' },
    ],
  },
  {
    email: 'ananya.iyer@demo.crayon.dev',
    display_name: 'Ananya Iyer',
    profile_title: 'Food Blogger & Recipe Creator',
    bio: "Recreating restaurant dishes at home and discovering hidden gems across Bangalore. South Indian home cooking + street food adventures. 3M+ recipe views.",
    city: 'Bangalore',
    niche: ['Food', 'Lifestyle'],
    language: ['Kannada', 'English', 'Hindi'],
    followers_instagram: 215000,
    engagement_rate_instagram: 6.1,
    reputation_score: 95,
    audience_india_pct: 93,
    audience_gender_male_pct: 35,
    audience_age_18_24_pct: 29,
    audience_age_25_34_pct: 48,
    audience_age_35_44_pct: 16,
    ig_verified: true,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 25000, delivery_days: 6, revisions: 2, description: 'Recipe or food experience Reel (60–90 sec). Includes your product naturally integrated into the cooking/tasting process.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 15000, delivery_days: 5, revisions: 2, description: 'Recipe carousel featuring your product — step-by-step visuals, saves very well.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 8000, delivery_days: 2, revisions: 1, description: '3 swipe-through stories with product highlight and poll engagement.' },
    ],
  },
  {
    email: 'vikas.fitness@demo.crayon.dev',
    display_name: 'Vikas Malhotra',
    profile_title: 'Fitness Coach & Transformation Creator',
    bio: "Certified strength coach based in Pune. Helping 100K+ people build sustainable fitness habits. Honest product reviews — I only recommend what I actually use.",
    city: 'Pune',
    niche: ['Fitness', 'Lifestyle'],
    language: ['Hindi', 'English'],
    followers_instagram: 178000,
    engagement_rate_instagram: 7.3,
    reputation_score: 91,
    audience_india_pct: 88,
    audience_gender_male_pct: 62,
    audience_age_18_24_pct: 42,
    audience_age_25_34_pct: 40,
    audience_age_35_44_pct: 13,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 20000, delivery_days: 5, revisions: 2, description: 'Workout or transformation Reel with your product integrated (protein, equipment, apparel). High-energy, motivational.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 12000, delivery_days: 4, revisions: 2, description: 'Educational post (e.g. "Top 5 reasons I use this supplement") — great for saves and reach.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 7000, delivery_days: 2, revisions: 1, description: 'Before/after or day-in-life story featuring your product.' },
    ],
  },
  {
    email: 'kavya.travels@demo.crayon.dev',
    display_name: 'Kavya Nair',
    profile_title: 'Solo Travel Creator | India & Beyond',
    bio: "25 states of India covered. Solo female traveller showing you the hidden corners of this incredible country. Budget trips, luxury stays, everything in between.",
    city: 'Kochi',
    niche: ['Travel', 'Lifestyle'],
    language: ['Malayalam', 'English', 'Hindi'],
    followers_instagram: 94000,
    engagement_rate_instagram: 8.2,
    reputation_score: 87,
    audience_india_pct: 82,
    audience_gender_male_pct: 40,
    audience_age_18_24_pct: 35,
    audience_age_25_34_pct: 46,
    audience_age_35_44_pct: 14,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 16000, delivery_days: 7, revisions: 2, description: 'Travel Reel featuring your destination, product, or service. Cinematic style with trending audio.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 10000, delivery_days: 5, revisions: 2, description: 'Destination or packing guide carousel with your product featured.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 5500, delivery_days: 2, revisions: 1, description: 'Travel story with product placement — great for travel gear and apps.' },
    ],
  },
  {
    email: 'sameer.comedy@demo.crayon.dev',
    display_name: 'Sameer Shaikh',
    profile_title: 'Comedy Sketch Creator',
    bio: "Making Mumbaikars laugh since 2019. Relatable office humour, family dynamics, and everyday desi life. My comments section is the real content.",
    city: 'Mumbai',
    niche: ['Comedy', 'Lifestyle'],
    language: ['Hindi', 'Marathi', 'English'],
    followers_instagram: 520000,
    engagement_rate_instagram: 9.4,
    reputation_score: 94,
    audience_india_pct: 96,
    audience_gender_male_pct: 55,
    audience_age_18_24_pct: 50,
    audience_age_25_34_pct: 35,
    audience_age_35_44_pct: 9,
    ig_verified: true,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 55000, delivery_days: 7, revisions: 2, description: '60-sec scripted comedy skit featuring your brand naturally in the story. High virality potential.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 15000, delivery_days: 3, revisions: 1, description: 'Branded story sequence — funny format, high completion rate.' },
    ],
  },
  {
    email: 'meera.beauty@demo.crayon.dev',
    display_name: 'Meera Rajput',
    profile_title: 'Skincare & Clean Beauty Advocate',
    bio: "Reviewing skincare so you don't have to spend ₹5000 on the wrong serum. Ingredient-first approach, dermat-approved recommendations from Jaipur.",
    city: 'Jaipur',
    niche: ['Beauty', 'Fashion'],
    language: ['Hindi', 'English'],
    followers_instagram: 67000,
    engagement_rate_instagram: 6.9,
    reputation_score: 85,
    audience_india_pct: 90,
    audience_gender_male_pct: 12,
    audience_age_18_24_pct: 44,
    audience_age_25_34_pct: 42,
    audience_age_35_44_pct: 10,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 12000, delivery_days: 5, revisions: 2, description: 'Skincare routine or GRWM Reel with your product. Get-ready-with-me format converts very well for beauty brands.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 8000, delivery_days: 4, revisions: 2, description: 'Ingredient breakdown or before/after carousel — educational content, high saves.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 4500, delivery_days: 2, revisions: 1, description: 'Morning/night routine stories with product highlight.' },
    ],
  },
  {
    email: 'arjun.finance@demo.crayon.dev',
    display_name: 'Arjun Mehta',
    profile_title: 'Personal Finance & Investing Creator',
    bio: "CA by qualification, creator by passion. Simplifying mutual funds, taxes, and financial independence for young India. Bangalore-based, numbers-obsessed.",
    city: 'Bangalore',
    niche: ['Finance', 'Education'],
    language: ['Hindi', 'English'],
    followers_instagram: 198000,
    engagement_rate_instagram: 5.6,
    reputation_score: 93,
    audience_india_pct: 94,
    audience_gender_male_pct: 68,
    audience_age_18_24_pct: 32,
    audience_age_25_34_pct: 50,
    audience_age_35_44_pct: 13,
    ig_verified: true,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 28000, delivery_days: 6, revisions: 2, description: '60-sec explainer Reel about your fintech, insurance, or financial product. High-trust, high-intent audience.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 18000, delivery_days: 5, revisions: 2, description: '"Top 5 reasons to use [product]" style carousel — high saves, great for loan/investment products.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 9000, delivery_days: 2, revisions: 1, description: 'Quick finance tip story with your app/product as the tool used.' },
    ],
  },
  {
    email: 'neha.parenting@demo.crayon.dev',
    display_name: 'Neha Agarwal',
    profile_title: 'Parenting & Mom Life Creator',
    bio: "Two kids, one Chennai, zero filters. Sharing real parenting wins and disasters. Trusted by 80K+ parents for honest baby product reviews and family lifestyle content.",
    city: 'Chennai',
    niche: ['Parenting', 'Lifestyle'],
    language: ['Tamil', 'Hindi', 'English'],
    followers_instagram: 81000,
    engagement_rate_instagram: 7.8,
    reputation_score: 89,
    audience_india_pct: 91,
    audience_gender_male_pct: 18,
    audience_age_18_24_pct: 15,
    audience_age_25_34_pct: 52,
    audience_age_35_44_pct: 27,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 13000, delivery_days: 5, revisions: 2, description: 'Mom/family life Reel with natural product integration. Great for baby care, edtech, household brands.' },
      { platform: 'Instagram', format: 'Carousel Post', price_inr: 9000, delivery_days: 4, revisions: 2, description: "Product review carousel from a parent's perspective — very high trust for parenting niche." },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 5000, delivery_days: 2, revisions: 1, description: 'Day-in-the-life or product demo stories.' },
    ],
  },
  {
    email: 'dev.gaming@demo.crayon.dev',
    display_name: 'Dev Kapoor',
    profile_title: 'Mobile Gaming & Esports Creator',
    bio: "Top 100 BGMI player, gaming creator from Hyderabad. Streaming, reviewing, and hyping up the Indian gaming community. 500K+ total views monthly.",
    city: 'Hyderabad',
    niche: ['Gaming', 'Tech'],
    language: ['Telugu', 'Hindi', 'English'],
    followers_instagram: 112000,
    engagement_rate_instagram: 8.9,
    reputation_score: 86,
    audience_india_pct: 95,
    audience_gender_male_pct: 85,
    audience_age_18_24_pct: 60,
    audience_age_25_34_pct: 28,
    audience_age_35_44_pct: 5,
    ig_verified: false,
    packages: [
      { platform: 'Instagram', format: 'Reel', price_inr: 15000, delivery_days: 5, revisions: 2, description: 'Gaming or lifestyle Reel with your product integrated. High Gen-Z reach.' },
      { platform: 'YouTube', format: 'Dedicated Video', price_inr: 40000, delivery_days: 10, revisions: 1, description: 'Dedicated gaming video or challenge video featuring your brand. Pinned comment + end card.' },
      { platform: 'Instagram', format: 'Story (3-slide)', price_inr: 6000, delivery_days: 2, revisions: 1, description: 'Gaming session stories with product placement — phone accessories, energy drinks, peripherals.' },
    ],
  },
]

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development' }, { status: 403 })
  }

  const admin = createAdminClient()
  const results: { name: string; status: string; error?: string }[] = []

  for (const creator of CREATORS) {
    try {
      // 1. Create auth user
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email: creator.email,
        password: 'DemoPass123!',
        email_confirm: true,
        user_metadata: { user_type: 'influencer' },
      })

      if (authErr && !authErr.message.includes('already been registered')) {
        results.push({ name: creator.display_name, status: 'failed', error: authErr.message })
        continue
      }

      // If user already exists, look them up
      let userId: string
      if (authErr?.message.includes('already been registered')) {
        const { data: existing } = await admin.auth.admin.listUsers()
        const found = existing?.users.find(u => u.email === creator.email)
        if (!found) {
          results.push({ name: creator.display_name, status: 'failed', error: 'User exists but not found' })
          continue
        }
        userId = found.id
      } else {
        userId = authData!.user!.id
      }

      // 2. Upsert influencer profile
      const { error: profileErr } = await admin
        .from('influencer_profiles')
        .upsert({
          user_id: userId,
          display_name: creator.display_name,
          profile_title: creator.profile_title,
          bio: creator.bio,
          city: creator.city,
          niche: creator.niche,
          language: creator.language,
          followers_instagram: creator.followers_instagram,
          engagement_rate_instagram: creator.engagement_rate_instagram,
          reputation_score: creator.reputation_score,
          audience_india_pct: creator.audience_india_pct,
          audience_gender_male_pct: creator.audience_gender_male_pct,
          audience_age_18_24_pct: creator.audience_age_18_24_pct,
          audience_age_25_34_pct: creator.audience_age_25_34_pct,
          audience_age_35_44_pct: creator.audience_age_35_44_pct,
          ig_verified: creator.ig_verified,
          is_profile_live: true,
          portfolio_urls: [],
          faq: [],
        }, { onConflict: 'user_id' })

      if (profileErr) {
        results.push({ name: creator.display_name, status: 'failed', error: profileErr.message })
        continue
      }

      // 3. Fetch the profile id
      const { data: profile } = await admin
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        results.push({ name: creator.display_name, status: 'failed', error: 'Profile not found after insert' })
        continue
      }

      // 4. Delete existing packages then re-insert
      await admin.from('content_packages').delete().eq('influencer_id', profile.id)

      const packages = creator.packages.map(p => ({
        influencer_id: profile.id,
        platform: p.platform,
        format: p.format,
        price_inr: p.price_inr,
        delivery_days: p.delivery_days,
        revisions: p.revisions,
        description: p.description,
      }))

      const { error: pkgErr } = await admin.from('content_packages').insert(packages)

      if (pkgErr) {
        results.push({ name: creator.display_name, status: 'partial', error: `Profile ok, packages failed: ${pkgErr.message}` })
      } else {
        results.push({ name: creator.display_name, status: 'ok' })
      }
    } catch (e) {
      results.push({ name: creator.display_name, status: 'failed', error: String(e) })
    }
  }

  const ok = results.filter(r => r.status === 'ok').length
  const failed = results.filter(r => r.status === 'failed').length

  return NextResponse.json({ summary: `${ok} created, ${failed} failed`, results })
}
