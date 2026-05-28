import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Guard: must explicitly opt-in via .env.local — never set in production
if (process.env.ENABLE_SEED_ROUTE !== 'true') {
  console.warn('[SEED] Route disabled. Set ENABLE_SEED_ROUTE=true in .env.local to enable.')
}

const PASS = 'Test@12345'
const DOMAIN = '@test.grabcollab.com'

export async function POST() {
  if (process.env.ENABLE_SEED_ROUTE !== 'true') {
    return NextResponse.json({ error: 'Seed route is disabled. Set ENABLE_SEED_ROUTE=true in .env.local.' }, { status: 403 })
  }

  const db = createAdminClient()

  // ── helpers ──────────────────────────────────────────────────────────────────
  function daysFromNow(n: number) {
    return new Date(Date.now() + n * 86_400_000).toISOString().split('T')[0]
  }
  function minsAgo(n: number) {
    return new Date(Date.now() - n * 60_000).toISOString()
  }

  async function upsertAuthUser(email: string, name: string) {
    // Delete if exists so seed is idempotent
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users.find(u => u.email === email)
    if (existing) await db.auth.admin.deleteUser(existing.id)

    const { data, error } = await db.auth.admin.createUser({
      email,
      password: PASS,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (error || !data.user) throw new Error(`createUser(${email}): ${error?.message}`)

    // Explicitly set password again — ensures the email/password identity is properly linked
    await db.auth.admin.updateUserById(data.user.id, { password: PASS })

    return data.user.id
  }

  try {

    // ── 1. Auth users ──────────────────────────────────────────────────────────
    const [
      snehaId, rahulId, priyaId, arjunId,
      crayonnId, technovaId,
    ] = await Promise.all([
      upsertAuthUser(`sneha${DOMAIN}`,  'Sneha Sharma'),
      upsertAuthUser(`rahul${DOMAIN}`,  'Rahul Verma'),
      upsertAuthUser(`priya${DOMAIN}`,  'Priya Mehta'),
      upsertAuthUser(`arjun${DOMAIN}`,  'Arjun Kapoor'),
      upsertAuthUser(`brand1${DOMAIN}`, 'Crayonn'),
      upsertAuthUser(`brand2${DOMAIN}`, 'TechNova'),
    ])

    // ── 2. public.users rows ───────────────────────────────────────────────────
    await db.from('users').insert([
      { id: snehaId,    role: 'influencer' },
      { id: rahulId,    role: 'influencer' },
      { id: priyaId,    role: 'influencer' },
      { id: arjunId,    role: 'influencer' },
      { id: crayonnId,  role: 'brand' },
      { id: technovaId, role: 'brand' },
    ])

    // ── 3. Creator profiles ────────────────────────────────────────────────────
    const { data: creators, error: cErr } = await db.from('creator_profiles').insert([
      {
        user_id: snehaId,
        username: 'snehasharma',
        display_name: 'Sneha Sharma',
        city: 'Mumbai',
        bio: 'Beauty enthusiast & skincare advocate 🌸 Helping you glow up every day! Sharing honest reviews and tutorials for Indian skin.',
        languages: ['Hindi', 'English'],
        niches: ['Beauty & Skincare', 'Fashion & Style'],
        instagram_url: 'https://instagram.com/snehasharma',
        instagram_followers: 25000,
        is_profile_live: true,
        onboarding_complete: true,
      },
      {
        user_id: rahulId,
        username: 'rahulvermatech',
        display_name: 'Rahul Verma',
        city: 'Bangalore',
        bio: 'Tech reviewer & gadget geek 💻 Unboxing the latest tech for Indian buyers. 85K+ YouTube subscribers.',
        languages: ['Hindi', 'English', 'Kannada'],
        niches: ['Tech & Gadgets', 'Business & Entrepreneurship'],
        youtube_url: 'https://youtube.com/@rahulvermatech',
        youtube_subscribers: 85000,
        instagram_url: 'https://instagram.com/rahulvermatech',
        instagram_followers: 12000,
        is_profile_live: true,
        onboarding_complete: true,
      },
      {
        user_id: priyaId,
        username: 'priyamehta_food',
        display_name: 'Priya Mehta',
        city: 'Delhi',
        bio: 'Home cook turned content creator 🍳 Authentic Indian recipes, quick meals, and restaurant discoveries.',
        languages: ['Hindi', 'English'],
        niches: ['Food & Cooking', 'Lifestyle & Vlogs'],
        instagram_url: 'https://instagram.com/priyamehta_food',
        instagram_followers: 8500,
        is_profile_live: true,
        onboarding_complete: true,
      },
      {
        user_id: arjunId,
        username: 'arjunfitness',
        display_name: 'Arjun Kapoor',
        city: 'Pune',
        bio: 'Certified trainer & fitness influencer 💪 Transformations, workouts, and nutrition built for Indian athletes.',
        languages: ['Hindi', 'English', 'Marathi'],
        niches: ['Fitness & Gym', 'Motivation & Mindset'],
        instagram_url: 'https://instagram.com/arjunfitness',
        instagram_followers: 152000,
        youtube_url: 'https://youtube.com/@arjunfitness',
        youtube_subscribers: 45000,
        is_profile_live: true,
        onboarding_complete: true,
      },
    ]).select('id, user_id')
    if (cErr) throw new Error(`creator_profiles: ${cErr.message}`)

    const snehaP  = creators!.find(c => c.user_id === snehaId)!
    const rahulP  = creators!.find(c => c.user_id === rahulId)!
    const priyaP  = creators!.find(c => c.user_id === priyaId)!
    const arjunP  = creators!.find(c => c.user_id === arjunId)!

    // ── 4. Content packages ────────────────────────────────────────────────────
    await db.from('content_packages').insert([
      { creator_id: snehaP.id,  platform: 'Instagram', content_type: 'Reel',           price_inr: 8000,  delivery_days: 5,  revisions: 2, is_active: true },
      { creator_id: snehaP.id,  platform: 'Instagram', content_type: 'Story',          price_inr: 2000,  delivery_days: 2,  revisions: 1, is_active: true },
      { creator_id: rahulP.id,  platform: 'YouTube',   content_type: 'Long form video', price_inr: 35000, delivery_days: 10, revisions: 2, is_active: true },
      { creator_id: rahulP.id,  platform: 'Instagram', content_type: 'Reel',           price_inr: 5000,  delivery_days: 5,  revisions: 1, is_active: true },
      { creator_id: priyaP.id,  platform: 'Instagram', content_type: 'Reel',           price_inr: 3500,  delivery_days: 4,  revisions: 2, is_active: true },
      { creator_id: priyaP.id,  platform: 'Instagram', content_type: 'Post',           price_inr: 1500,  delivery_days: 2,  revisions: 1, is_active: true },
      { creator_id: arjunP.id,  platform: 'Instagram', content_type: 'Reel',           price_inr: 25000, delivery_days: 7,  revisions: 2, is_active: true },
      { creator_id: arjunP.id,  platform: 'YouTube',   content_type: 'Long form video', price_inr: 50000, delivery_days: 14, revisions: 2, is_active: true },
    ])

    // ── 5. Brand profiles ──────────────────────────────────────────────────────
    const { data: brands, error: bErr } = await db.from('brand_profiles').insert([
      {
        user_id: crayonnId,
        brand_name: 'Crayonn',
        type: 'product',
        niche: 'Beauty & Skincare',
        description: 'Crayonn is an Indian D2C skincare brand crafting dermatologist-tested formulas for Indian skin tones. We believe in clean beauty that actually works.',
        website_url: 'https://crayonn.com',
        instagram_url: 'https://instagram.com/crayonn',
        city: 'Mumbai',
        team_size: '11–50',
        onboarding_complete: true,
      },
      {
        user_id: technovaId,
        brand_name: 'TechNova',
        type: 'product',
        niche: 'Tech & Gadgets',
        description: 'TechNova brings cutting-edge consumer electronics to India — from laptops to smart home devices. We make technology accessible and exciting.',
        website_url: 'https://technova.in',
        instagram_url: 'https://instagram.com/technovaindia',
        youtube_url: 'https://youtube.com/@technovaindia',
        city: 'Bangalore',
        team_size: '51–200',
        onboarding_complete: true,
      },
    ]).select('id, user_id')
    if (bErr) throw new Error(`brand_profiles: ${bErr.message}`)

    const crayonnB  = brands!.find(b => b.user_id === crayonnId)!
    const technovaB = brands!.find(b => b.user_id === technovaId)!

    // ── 6. Campaigns ───────────────────────────────────────────────────────────
    const { data: campaigns, error: campErr } = await db.from('campaigns').insert([
      {
        brand_id: crayonnB.id,
        title: 'Reel for sunscreen launch',
        goal: `We're launching our new SPF 50+ sunscreen this summer and need Instagram creators to make authentic, relatable content.\n\nWhat we're looking for:\n- A 30–60 second reel showing your morning skincare routine featuring our sunscreen\n- Honest review of texture, finish, and how it wears under Indian summer heat\n- Key benefits to mention: SPF 50+ protection, no white cast, lightweight formula\n\nTone: Fun, real, "friend recommending to friend" — not staged or overly polished.`,
        platforms: ['Instagram'],
        deliverable_formats: ['Reel'],
        niches: ['Beauty & Skincare', 'Fashion & Style'],
        budget_inr: 9999,
        application_deadline: daysFromNow(14),
        content_deadline: daysFromNow(28),
        status: 'open',
      },
      {
        brand_id: crayonnB.id,
        title: 'Summer Skincare Series — 3 posts',
        goal: `Looking for creators to build a 3-part skincare series for our Summer Glow campaign.\n\nDeliverables:\n1. AM routine reel featuring our Vitamin C serum\n2. PM routine reel with our overnight repair moisturiser\n3. A "results after 30 days" transformation post\n\nIdeal creator profile: Clean, aesthetic feed. Authentic engagement with their audience. Tier-1 city preferred but not mandatory.`,
        platforms: ['Instagram'],
        deliverable_formats: ['Reel', 'Post'],
        niches: ['Beauty & Skincare', 'Lifestyle & Vlogs'],
        budget_inr: 25000,
        application_deadline: daysFromNow(30),
        content_deadline: daysFromNow(50),
        status: 'open',
      },
      {
        brand_id: technovaB.id,
        title: 'Unboxing + Review: TechNova ProBook 14',
        goal: `We need a detailed unboxing and first-impressions review for our new ProBook 14 laptop.\n\nKey points to cover:\n- Build quality & design (all-metal body, 1.4 kg)\n- Performance: AMD Ryzen 7, 16GB RAM, NVMe SSD\n- Battery life (up to 12 hours claimed — test it honestly)\n- Value comparison vs competitors in the ₹60K–70K range\n- Target audience: engineering students and young IT professionals\n\nReview unit shipped to you. Video: 8–15 minutes, honest review preferred over promotional.`,
        platforms: ['YouTube'],
        deliverable_formats: ['Long Video'],
        niches: ['Tech & Gadgets'],
        budget_inr: 30000,
        application_deadline: daysFromNow(20),
        content_deadline: daysFromNow(40),
        status: 'open',
      },
      {
        brand_id: technovaB.id,
        title: 'Instagram awareness — TechNova SmartWatch',
        goal: `Quick Instagram campaign for our new SmartWatch launch targeted at young professionals.\n\n1 reel (30–45 sec) showing the watch in a lifestyle context — gym, commute, or office. Highlight:\n- Sleek AMOLED display design\n- Health tracking: steps, SpO2, heart rate\n- 7-day battery life\n\nKeep it aspirational and fast-paced. Music-driven edit works well for this product.`,
        platforms: ['Instagram'],
        deliverable_formats: ['Reel'],
        niches: ['Tech & Gadgets', 'Fitness & Gym'],
        budget_inr: 8000,
        application_deadline: daysFromNow(7),
        content_deadline: daysFromNow(18),
        status: 'open',
      },
    ]).select('id, title')
    if (campErr) throw new Error(`campaigns: ${campErr.message}`)

    const sunscreenC = campaigns!.find(c => c.title.includes('sunscreen'))!
    const summerC    = campaigns!.find(c => c.title.includes('Summer'))!
    const laptopC    = campaigns!.find(c => c.title.includes('ProBook'))!
    const watchC     = campaigns!.find(c => c.title.includes('SmartWatch'))!

    // ── 7. Applications ────────────────────────────────────────────────────────
    await db.from('applications').insert([
      // Sneha → sunscreen: shortlisted ✅
      {
        campaign_id: sunscreenC.id,
        creator_id: snehaP.id,
        cover_note: "Hi! I'm Sneha, a Mumbai-based beauty creator with 25K Instagram followers. My audience is 90% women aged 18–34 who trust my skincare recommendations deeply. I've done paid collabs with 3 skincare brands before and my reels average 80K+ views organically. I'd love to create an authentic morning-routine reel featuring your sunscreen — my followers have been specifically asking me for a good SPF recommendation, so the timing is perfect!",
        proposed_rate_inr: 7500,
        status: 'shortlisted',
      },
      // Priya → sunscreen: pending ⏳
      {
        campaign_id: sunscreenC.id,
        creator_id: priyaP.id,
        cover_note: "Hello Crayonn team! I know I'm primarily a food creator but I've been expanding into skincare content and my followers love the crossover. I'd pitch a unique angle — morning skincare before cooking, bridging both niches. My Delhi audience resonates deeply because we deal with pollution + sun damage daily. Would love to collaborate on this!",
        proposed_rate_inr: 3000,
        status: 'pending',
      },
      // Rahul → laptop: selected 🏆 (will auto-create conversation)
      {
        campaign_id: laptopC.id,
        creator_id: rahulP.id,
        cover_note: "Hey TechNova! I've been reviewing laptops for 3 years with 85K YouTube subscribers, and my audience is exactly your target market — engineering students and young IT professionals in India. My last laptop review got 2.1 lakh views and drove measurable traffic per the brand's own analytics. I do detailed, honest reviews that build trust. Very excited about the ProBook 14 — the Ryzen 7 at that price point is interesting.",
        proposed_rate_inr: 28000,
        status: 'selected',
      },
      // Arjun → summer series: pending ⏳
      {
        campaign_id: summerC.id,
        creator_id: arjunP.id,
        cover_note: "Hi Crayonn! Arjun here from Pune. I know fitness isn't your primary niche, but skincare is massive in the fitness community — we deal with sweat, sun exposure, and post-workout skin irritation constantly. I'd approach this from an athlete skincare angle, giving your brand exposure to a completely new audience segment. I have 1.5L Instagram followers with one of the highest engagement rates in the fitness space.",
        proposed_rate_inr: 22000,
        status: 'pending',
      },
    ])

    // ── 8. Conversation: Rahul ↔ TechNova (from selection) ────────────────────
    const { data: convos, error: convErr } = await db.from('conversations').insert([
      {
        brand_id: technovaB.id,
        creator_id: rahulP.id,
        initiated_by: 'brand',
        creator_accepted: true,
        campaign_id: laptopC.id,
        last_message_at: minsAgo(60),
      },
    ]).select('id')
    if (convErr) throw new Error(`conversations: ${convErr.message}`)

    const rahulConvo = convos![0].id

    await db.from('messages').insert([
      {
        conversation_id: rahulConvo,
        sender_id: technovaId,
        content: "Hey Rahul! Congrats, we've selected you for the TechNova ProBook 14 review 🎉 Really looking forward to working with you. When are you free for a quick 20-min call to walk through the brief?",
        created_at: minsAgo(240),
      },
      {
        conversation_id: rahulConvo,
        sender_id: rahulId,
        content: "Thanks so much TechNova team! Really excited about this one. I'm free any weekday evening after 7 PM IST. How about Wednesday or Thursday this week?",
        created_at: minsAgo(200),
      },
      {
        conversation_id: rahulConvo,
        sender_id: technovaId,
        content: "Thursday 7:30 PM works perfectly. I'll send a Google Meet invite now. We'll also courier the review unit tomorrow — you should have it by Wednesday morning.",
        created_at: minsAgo(150),
      },
      {
        conversation_id: rahulConvo,
        sender_id: rahulId,
        content: "Perfect! Please courier to my Bangalore address — I'll DM you the details. See you Thursday 🙌",
        created_at: minsAgo(60),
      },
    ])

    // ── 9. Seed notifications (so badges show on first login) ─────────────────
    await db.from('notifications').insert([
      // Sneha: shortlisted notification → dot on My Applications
      { user_id: snehaId,    type: 'shortlisted',    message: "You've been shortlisted for \"Reel for sunscreen launch\"!",   link: '/applications',                         read: false },
      // Rahul: selected + unread message → dot + badge
      { user_id: rahulId,    type: 'selected',       message: "You've been selected for \"Unboxing + Review: TechNova ProBook 14\"!", link: '/applications',                 read: false },
      { user_id: rahulId,    type: 'new_message',    message: 'You have a new message from TechNova',                          link: `/messages/${rahulConvo}`,               read: false },
      // Crayonn: 2 new applications pending
      { user_id: crayonnId,  type: 'new_application', message: 'New application for "Reel for sunscreen launch"',              link: `/brand/campaigns/${sunscreenC.id}`,     read: false },
      { user_id: crayonnId,  type: 'new_application', message: 'New application for "Summer Skincare Series — 3 posts"',       link: `/brand/campaigns/${summerC.id}`,        read: false },
      // TechNova: unread message (Rahul's last reply)
      { user_id: technovaId, type: 'new_message',    message: 'New message from Rahul Verma',                                  link: `/brand/messages/${rahulConvo}`,         read: false },
    ])

    // ── Done ──────────────────────────────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      message: '✅ Seed complete! All test accounts ready.',
      password: PASS,
      creators: [
        { name: 'Sneha Sharma',  email: `sneha${DOMAIN}`,  status: 'Shortlisted on sunscreen campaign — has 🔴 dot on My Applications' },
        { name: 'Rahul Verma',   email: `rahul${DOMAIN}`,  status: 'Selected for laptop campaign — has unread messages + 🔴 dot' },
        { name: 'Priya Mehta',   email: `priya${DOMAIN}`,  status: 'Pending application on sunscreen campaign' },
        { name: 'Arjun Kapoor',  email: `arjun${DOMAIN}`,  status: 'Pending application on summer skincare series' },
      ],
      brands: [
        { name: 'Crayonn',   email: `brand1${DOMAIN}`, status: '2 open campaigns · 3 applicants · 2 unread in My Campaigns' },
        { name: 'TechNova',  email: `brand2${DOMAIN}`, status: '2 open campaigns · Rahul selected · active chat · unread message' },
      ],
    })

  } catch (err: any) {
    console.error('[SEED ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
