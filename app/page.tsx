import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'

export const metadata = {
  title: "Crayon — India's Influencer Marketplace",
  description:
    'Find and hire verified Indian creators on Instagram, YouTube, Moj & ShareChat. Pay securely via escrow. GST invoices included.',
}

const GRADIENTS = [
  'from-[#9FE870] to-[#163300]',
  'from-violet-400 to-purple-700',
  'from-orange-300 to-rose-600',
  'from-sky-300 to-blue-700',
  'from-amber-300 to-orange-600',
  'from-pink-300 to-fuchsia-600',
  'from-teal-300 to-emerald-700',
  'from-indigo-300 to-violet-700',
]

const EXAMPLE_CREATORS = [
  { id: 'ex1', display_name: 'Priya Sharma',    city: 'Mumbai',    niche: ['Fashion', 'Lifestyle'],       followers: '180K', platform: 'Instagram', price: '₹8,000',  gradient: GRADIENTS[0], top: true  },
  { id: 'ex2', display_name: 'Rohan Verma',     city: 'Delhi',     niche: ['Tech', 'Gaming'],             followers: '520K', platform: 'YouTube',   price: '₹25,000', gradient: GRADIENTS[1], top: true  },
  { id: 'ex3', display_name: 'Ananya Patel',    city: 'Bangalore', niche: ['Beauty', 'Skincare'],         followers: '95K',  platform: 'Instagram', price: '₹5,500',  gradient: GRADIENTS[2], top: false },
  { id: 'ex4', display_name: 'Vikram Singh',    city: 'Chennai',   niche: ['Fitness', 'Wellness'],        followers: '240K', platform: 'Instagram', price: '₹12,000', gradient: GRADIENTS[3], top: false },
  { id: 'ex5', display_name: 'Meera Nair',      city: 'Kochi',     niche: ['Food', 'Travel'],             followers: '67K',  platform: 'YouTube',   price: '₹7,000',  gradient: GRADIENTS[4], top: false },
  { id: 'ex6', display_name: 'Arjun Mehta',     city: 'Hyderabad', niche: ['Finance', 'Business'],       followers: '310K', platform: 'YouTube',   price: '₹18,000', gradient: GRADIENTS[5], top: true  },
  { id: 'ex7', display_name: 'Kavya Rao',       city: 'Pune',      niche: ['Comedy', 'Entertainment'],   followers: '1.2M', platform: 'Moj',       price: '₹35,000', gradient: GRADIENTS[6], top: false },
  { id: 'ex8', display_name: 'Siddharth Kumar', city: 'Kolkata',   niche: ['Education', 'Career'],       followers: '88K',  platform: 'ShareChat', price: '₹4,500',  gradient: GRADIENTS[7], top: false },
]

const POPULAR_CATEGORIES = [
  'Lifestyle', 'Fashion', 'Beauty & Skincare', 'Food & Drink', 'Health & Fitness', 'Comedy & Entertainment',
]

const MORE_CATEGORIES = [
  'Finance & Investing', 'Technology', 'Travel', 'Education', 'Music & Dance', 'Parenting',
  'Sports & Cricket', 'Gaming', 'Entrepreneurship', 'Art & Photography', 'Home Decor',
  'Automotive', 'Wedding & Bridal', 'Animals & Pets', 'Sustainable Living',
  'Astrology & Spirituality', 'Saree & Ethnic Wear', 'Regional Content',
]

export default async function Landing() {
  return (
    <div className="text-[#121511] overflow-x-hidden" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <style>{`
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scroll-track { animation: scroll-left 32s linear infinite; }
        .scroll-track:hover { animation-play-state: paused; }
        select { -webkit-appearance: none; appearance: none; }
      `}</style>
      <Hero />
      <CreatorShowcase />
      <HowItWorks />
      <WhyCrayon />
      <Testimonials />
      <FooterCta />
      <Footer />
    </div>
  )
}

/* ─────────────────────── HERO ─────────────────────── */
function Hero() {
  return (
    <section className="bg-[#163300] pt-[100px] pb-0 px-5 md:px-[70px] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(159,232,112,0.06) 0%, transparent 70%)' }}
      />

      {/* Center-aligned content */}
      <div className="max-w-[860px] mx-auto text-center relative z-10 pt-10 pb-14">
        <h1 className="text-[64px] md:text-[96px] font-black leading-[0.88] uppercase tracking-tight text-white mb-6">
          Find India&rsquo;s<br />
          <span className="text-[#9FE870]">Top Creators.</span>
        </h1>

        <p className="text-[17px] md:text-[19px] text-white/55 leading-relaxed max-w-[520px] mx-auto mb-10">
          Search verified influencers across Instagram, YouTube, Moj and ShareChat. Pay safely. Get GST invoices automatically.
        </p>

        {/* Search bar */}
        <form action="/brand/discover" method="GET" className="bg-white rounded-2xl flex items-stretch max-w-[660px] mx-auto overflow-hidden shadow-lg">
          {/* Platform */}
          <div className="relative flex-1 border-r border-[#E8E8E8]">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] pt-3.5 px-5 pb-0 text-left">Platform</label>
            <select
              name="platform"
              className="w-full px-5 pb-3.5 pt-0.5 text-[15px] text-[#6A6C6A] bg-transparent focus:outline-none cursor-pointer text-left"
              defaultValue=""
            >
              <option value="">Any platform</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="moj">Moj</option>
              <option value="sharechat">ShareChat</option>
            </select>
          </div>

          {/* Category */}
          <div className="relative flex-[1.4]">
            <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] pt-3.5 px-5 pb-0 text-left">Category</label>
            <select
              name="category"
              className="w-full px-5 pb-3.5 pt-0.5 text-[15px] text-[#6A6C6A] bg-transparent focus:outline-none cursor-pointer text-left"
              defaultValue=""
            >
              <option value="">All categories</option>
              <optgroup label="Popular">
                {POPULAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="More Categories">
                {MORE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="flex-shrink-0 w-14 flex items-center justify-center bg-[#121511] hover:bg-[#163300] transition-colors m-2 rounded-xl"
            aria-label="Search creators"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>

      {/* Auto-scrolling creator cards */}
      <div className="relative overflow-hidden pb-0 -mb-0">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #163300, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #163300, transparent)' }} />

        <div className="scroll-track flex gap-4 w-max pb-6 pt-2">
          {[...EXAMPLE_CREATORS, ...EXAMPLE_CREATORS].map((c, i) => (
            <Link
              key={i}
              href="/brand/discover"
              className="flex-shrink-0 w-[200px] bg-white/10 border border-white/10 rounded-[20px] overflow-hidden hover:bg-white/15 transition-colors group"
            >
              <div className={`h-[140px] bg-gradient-to-br ${c.gradient} relative flex items-center justify-center`}>
                <span className="text-[60px] font-black text-white/10 select-none">{c.display_name[0]}</span>
                <span className="absolute top-2 right-2 bg-black/30 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {c.followers}
                </span>
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold text-white truncate">{c.display_name}</p>
                <p className="text-[11px] text-white/50 mt-0.5">{c.niche[0]}</p>
                <p className="text-[12px] font-black text-[#9FE870] mt-1.5">From {c.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── CREATOR SHOWCASE ─────────────────────── */
async function CreatorShowcase() {
  const supabase = await createClient()
  const { data: db } = await supabase
    .from('influencer_profiles')
    .select('id, display_name, city, niche, reputation_score')
    .eq('is_profile_live', true)
    .limit(8)

  type Card = {
    id: string
    display_name: string
    city: string
    niche: string[]
    followers: string
    price: string
    gradient: string
    isReal: boolean
    top: boolean
  }

  const creators: Card[] = (db && db.length > 0)
    ? db.map((c, i) => ({
        id: c.id,
        display_name: c.display_name || 'Creator',
        city: c.city || 'India',
        niche: (c.niche as string[]) || [],
        followers: '—',
        price: '—',
        gradient: GRADIENTS[i % GRADIENTS.length],
        isReal: true,
        top: i < 2,
      }))
    : EXAMPLE_CREATORS.map(c => ({ ...c, isReal: false }))

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-2">Browse Creators</p>
            <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] leading-[0.9] uppercase">
              10,000+<br />
              <span className="text-[#163300]">Verified Creators</span>
            </h2>
          </div>
          <Link
            href="/brand/discover"
            className="inline-flex items-center gap-2 bg-[#163300] text-[#9FE870] font-bold text-[15px] px-7 py-3.5 rounded-full hover:bg-[#1c4400] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300] flex-shrink-0"
          >
            See All Creators →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {creators.map((c, i) => (
            <Link
              key={c.id}
              href={c.isReal ? `/influencer/${c.id}` : '/brand/discover'}
              className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#163300] rounded-[20px]"
            >
              <div className="bg-white rounded-[20px] overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200">
                {/* Thumbnail */}
                <div className={`h-[150px] bg-gradient-to-br ${c.gradient} relative flex items-center justify-center`}>
                  <span className="text-[52px] font-black text-white/10 select-none">{c.display_name[0]}</span>

                  {/* Top Creator badge */}
                  {c.top && (
                    <span className="absolute top-3 left-3 bg-[#9FE870] text-[#163300] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                      Top Creator
                    </span>
                  )}

                  {/* Followers */}
                  {c.followers !== '—' && (
                    <span className="absolute top-3 right-3 bg-black/35 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {c.followers}
                    </span>
                  )}

                  {/* Avatar */}
                  <div className="absolute -bottom-4 left-4 w-9 h-9 rounded-full bg-[#163300] border-[3px] border-white flex items-center justify-center text-[#9FE870] font-black text-[13px] z-10">
                    {c.display_name[0]}
                  </div>
                </div>

                {/* Info */}
                <div className="pt-6 px-4 pb-4">
                  <p className="text-[14px] font-bold text-[#121511] leading-tight mb-0.5">{c.display_name}</p>
                  <p className="text-[12px] text-[#6A6C6A] mb-3">{c.city} · {c.niche[0] || 'Creator'}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.niche.slice(0, 2).map((n: string) => (
                      <span key={n} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#163300] rounded-full font-medium">{n}</span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#6A6C6A] uppercase tracking-wide">Starting from</p>
                      <p className="text-[13px] font-black text-[#163300]">{c.price !== '—' ? c.price : 'View profile'}</p>
                    </div>
                    <span className="text-[12px] font-bold text-[#163300] bg-[#EDEFEB] group-hover:bg-[#163300] group-hover:text-[#9FE870] px-3 py-1.5 rounded-full transition-colors">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── HOW IT WORKS ─────────────────────── */
function HowItWorks() {
  return (
    <section className="bg-white py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="mb-14">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">How It Works</p>
          <h2 className="text-[48px] md:text-[72px] font-black text-[#121511] uppercase leading-[0.88] max-w-[700px]">
            From brief to<br />
            <span className="text-[#9FE870]">content in days.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E8E8] border border-[#E8E8E8] rounded-[24px] overflow-hidden">
          {[
            {
              n: '01',
              title: 'Post a Campaign',
              body: 'Write your brief, set your budget, pick your platform and niche. Ready in under 5 minutes.',
              metric: '5 min setup',
            },
            {
              n: '02',
              title: 'Creators Apply',
              body: 'Vetted Indian creators pitch to you with their rate. Review portfolios, chat in-app, pick your match.',
              metric: '10,000+ creators',
            },
            {
              n: '03',
              title: 'Pay & Receive',
              body: 'Funds held in escrow. Creator delivers content. You approve — or it auto-releases after 72 hours. GST invoice included.',
              metric: '100% Secure',
            },
          ].map((s) => (
            <div key={s.n} className="bg-white p-8 md:p-10">
              <span className="text-[72px] font-black text-[#9FE870] leading-none block">{s.n}</span>
              <h3 className="text-[22px] font-black text-[#121511] mt-4 mb-3">{s.title}</h3>
              <p className="text-[15px] text-[#6A6C6A] leading-relaxed">{s.body}</p>
              <div className="mt-8 pt-6 border-t border-[#E8E8E8]">
                <p className="text-[24px] font-black text-[#163300]">{s.metric}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="bg-[#163300] text-[#9FE870] font-bold text-[16px] px-8 py-4 rounded-full hover:bg-[#1c4400] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300]"
          >
            Post a Campaign →
          </Link>
          <Link
            href="/creator"
            className="bg-[#EDEFEB] text-[#163300] font-bold text-[16px] px-8 py-4 rounded-full hover:bg-[#e0e2de] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300]"
          >
            Join as Creator →
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── WHY CRAYON ─────────────────────── */
function WhyCrayon() {
  return (
    <section className="bg-[#163300] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="mb-14">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9FE870]/50 mb-3">Why Crayon</p>
          <h2 className="text-[48px] md:text-[68px] font-black text-white uppercase leading-[0.88]">
            Built for<br />Indian brands.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Verified Indian Creators',
              body: 'Every creator is reviewed by our team. Real followers, verified handles, consistent engagement — no fake accounts.',
              metric: '10,000+',
              metricLabel: 'Verified Creators',
            },
            {
              title: 'Payments Held in Escrow',
              body: 'Pay only when you are satisfied. Funds are held securely until you approve the content. Full refund if the creator cannot deliver.',
              metric: '100%',
              metricLabel: 'Payment Security',
            },
            {
              title: 'Made for India',
              body: 'GST invoices, INR pricing, regional platforms, and content filters — designed for how Indian brands and creators work.',
              metric: '₹0',
              metricLabel: 'To Start Browsing',
            },
            {
              title: 'Fast Turnaround',
              body: 'Content delivered in 72 hours. Auto-approves if you do not respond in time. Everything lands directly in your dashboard.',
              metric: '72h',
              metricLabel: 'Avg Turnaround',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white/[0.07] border border-white/[0.12] rounded-[24px] p-8 hover:bg-white/[0.11] transition-colors">
              <h3 className="text-[22px] font-black text-white mb-3">{f.title}</h3>
              <p className="text-[15px] text-white/55 leading-relaxed mb-8">{f.body}</p>
              <div className="pt-6 border-t border-white/10">
                <p className="text-[52px] font-black text-[#9FE870] leading-none">{f.metric}</p>
                <p className="text-[14px] text-white/40 mt-1">{f.metricLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── TESTIMONIALS ─────────────────────── */
function Testimonials() {
  const testimonials = [
    {
      quote: 'Found 3 Instagram creators in 2 days. Escrow gave us complete peace of mind — we only paid after approving the content.',
      name: 'Priya Mehta',
      role: 'Marketing Head, D2C Brand',
    },
    {
      quote: 'Finally a platform built for India. Got paid within 72 hours — no chasing, no WhatsApp back-and-forth.',
      name: 'Rahul Sharma',
      role: 'Instagram Creator, 180K followers',
    },
    {
      quote: 'GST invoices are generated automatically for every order. Our finance team loves it. Campaign management is so much faster now.',
      name: 'Ankit Jain',
      role: 'Founder, Bangalore D2C Brand',
    },
  ]

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="mb-12">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">What People Say</p>
          <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] uppercase leading-[0.88]">
            Real results,<br />
            <span className="text-[#163300]">real growth.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-[24px] p-8 flex flex-col">
              <p className="text-[17px] text-[#121511] leading-relaxed flex-1 mb-8">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-5 border-t border-[#F0F0F0]">
                <div className="w-10 h-10 bg-[#163300] rounded-full flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-[#121511]">{t.name}</p>
                  <p className="text-[13px] text-[#6A6C6A]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── FOOTER CTA ─────────────────────── */
function FooterCta() {
  return (
    <section className="bg-[#163300] py-[100px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9FE870]/50 mb-4">Get Started</p>
        <h2 className="text-[56px] md:text-[88px] font-black text-white uppercase leading-[0.88] mb-6">
          Your next brand deal<br />
          <span className="text-[#9FE870]">starts here.</span>
        </h2>
        <p className="text-[18px] text-white/55 mb-10 max-w-[440px] mx-auto">
          Post your first campaign in under 5 minutes. Pay only when you are happy with the content.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/login"
            className="bg-[#9FE870] text-[#163300] font-bold text-[18px] px-12 py-5 rounded-full hover:bg-[#8fdc60] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Find Creators →
          </Link>
          <Link
            href="/creator"
            className="bg-white/10 text-white border border-white/20 font-bold text-[18px] px-12 py-5 rounded-full hover:bg-white/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Join as Creator
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 border-t border-white/10 pt-14">
          {[
            ['10,000+', 'Verified Creators'],
            ['₹2Cr+', 'Paid to Creators'],
            ['72h', 'Avg Turnaround'],
            ['100%', 'Secure Payments'],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="text-[40px] font-black text-[#9FE870] leading-none">{val}</p>
              <p className="text-[13px] text-white/45 mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── FOOTER ─────────────────────── */
function Footer() {
  return (
    <footer className="bg-white border-t border-[#E8E8E8] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto py-[80px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Resources</p>
            <ul className="flex flex-col gap-3">
              {['Pricing', 'Blog', 'Resource Hub', '2026 Influencer Report', 'Brand Stories'].map((l) => (
                <li key={l}>
                  <Link href="/pricing" className="text-[15px] text-[#6A6C6A] hover:text-[#163300] transition-colors focus-visible:underline">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Tools</p>
            <ul className="flex flex-col gap-3">
              {['Price Calculator', 'Engagement Rate Calculator', 'Campaign Brief Template', 'Influencer Contract Template'].map((l) => (
                <li key={l}>
                  <Link href="/tools/price-calculator" className="text-[15px] text-[#6A6C6A] hover:text-[#163300] transition-colors focus-visible:underline">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Discover</p>
            <ul className="flex flex-col gap-3">
              {['Find Influencers', 'Top Creators', 'Search by Platform', 'Search by Niche'].map((l) => (
                <li key={l}>
                  <Link href="/brand/discover" className="text-[15px] text-[#6A6C6A] hover:text-[#163300] transition-colors focus-visible:underline">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Support</p>
            <ul className="flex flex-col gap-3">
              {['Contact Us', 'How It Works', 'FAQ'].map((l) => (
                <li key={l}>
                  <Link href="/login" className="text-[15px] text-[#6A6C6A] hover:text-[#163300] transition-colors focus-visible:underline">{l}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <p className="text-[22px] font-black text-[#163300]">Crayon</p>
              <p className="text-[13px] text-[#6A6C6A] mt-1">India&rsquo;s Influencer Marketplace</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#E8E8E8] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#6A6C6A]">
          <span>© {new Date().getFullYear()} Crayon. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#163300] transition-colors focus-visible:underline">Privacy</Link>
            <Link href="/login" className="hover:text-[#163300] transition-colors focus-visible:underline">Terms</Link>
            <Link href="/login" className="hover:text-[#163300] transition-colors focus-visible:underline">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
