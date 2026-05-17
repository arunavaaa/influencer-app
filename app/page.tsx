import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HeroSearch } from '@/components/shared/HeroSearch'

export const metadata = {
  title: "Crayon — India's Influencer Marketplace",
  description:
    'Find and work with verified Indian creators on Instagram, YouTube, Moj & ShareChat.',
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
  'from-rose-400 to-pink-600',
  'from-cyan-400 to-teal-700',
  'from-lime-400 to-green-700',
  'from-orange-400 to-yellow-500',
]

const EXAMPLE_CREATORS = [
  { id: 'ex1', display_name: 'Priya Sharma',    city: 'Mumbai',    niche: ['Fashion', 'Lifestyle'],     followers: '180K', price: '₹8,000',  gradient: GRADIENTS[0],  top: true  },
  { id: 'ex2', display_name: 'Rohan Verma',     city: 'Delhi',     niche: ['Tech', 'Gaming'],           followers: '520K', price: '₹25,000', gradient: GRADIENTS[1],  top: true  },
  { id: 'ex3', display_name: 'Ananya Patel',    city: 'Bangalore', niche: ['Beauty', 'Skincare'],       followers: '95K',  price: '₹5,500',  gradient: GRADIENTS[2],  top: false },
  { id: 'ex4', display_name: 'Vikram Singh',    city: 'Chennai',   niche: ['Fitness', 'Wellness'],      followers: '240K', price: '₹12,000', gradient: GRADIENTS[3],  top: false },
  { id: 'ex5', display_name: 'Meera Nair',      city: 'Kochi',     niche: ['Food', 'Travel'],           followers: '67K',  price: '₹7,000',  gradient: GRADIENTS[4],  top: false },
  { id: 'ex6', display_name: 'Arjun Mehta',     city: 'Hyderabad', niche: ['Finance', 'Business'],     followers: '310K', price: '₹18,000', gradient: GRADIENTS[5],  top: true  },
  { id: 'ex7', display_name: 'Kavya Rao',       city: 'Pune',      niche: ['Comedy', 'Entertainment'], followers: '1.2M', price: '₹35,000', gradient: GRADIENTS[6],  top: false },
  { id: 'ex8', display_name: 'Siddharth Kumar', city: 'Kolkata',   niche: ['Education', 'Career'],     followers: '88K',  price: '₹4,500',  gradient: GRADIENTS[7],  top: false },
  { id: 'ex9', display_name: 'Riya Desai',      city: 'Ahmedabad', niche: ['Lifestyle', 'Home Decor'], followers: '43K',  price: '₹3,500',  gradient: GRADIENTS[8],  top: false },
  { id: 'ex10', display_name: 'Neha Joshi',     city: 'Jaipur',    niche: ['Bridal', 'Fashion'],       followers: '120K', price: '₹9,000',  gradient: GRADIENTS[9],  top: false },
  { id: 'ex11', display_name: 'Aditya Roy',     city: 'Mumbai',    niche: ['Music', 'Lifestyle'],      followers: '890K', price: '₹45,000', gradient: GRADIENTS[10], top: true  },
  { id: 'ex12', display_name: 'Pooja Menon',    city: 'Kochi',     niche: ['Wellness', 'Yoga'],        followers: '55K',  price: '₹4,000',  gradient: GRADIENTS[11], top: false },
]

export default async function Landing() {
  return (
    <div className="text-[#121511] overflow-x-hidden" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <style>{`
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scroll-track { animation: scroll-left 40s linear infinite; }
        .scroll-track:hover { animation-play-state: paused; }
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
    <section className="bg-[#163300]">
      {/* Radial glow */}
      <div
        className="pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(159,232,112,0.06) 0%, transparent 70%)', height: 0 }}
      />

      {/* Centered content */}
      <div className="max-w-[860px] mx-auto text-center px-5 md:px-10 pt-[100px] pb-12">
        <h1 className="text-[64px] md:text-[96px] font-black leading-[0.88] uppercase tracking-tight text-white mb-6">
          Find India&rsquo;s<br />
          <span className="text-[#9FE870]">Top Creators.</span>
        </h1>

        <p className="text-[17px] md:text-[19px] text-white/55 leading-relaxed max-w-[500px] mx-auto mb-10">
          Find and work with verified Indian creators across Instagram, YouTube, Moj and ShareChat.
        </p>

        {/* Interactive search — client component */}
        <HeroSearch />
      </div>

      {/* Edge-to-edge auto-scrolling video placeholder cards */}
      <div className="relative" style={{ height: '220px', overflow: 'hidden' }}>
        {/* Left + right fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #163300 20%, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #163300 20%, transparent)' }} />

        {/* Cards track — cards are 280px tall, container is 220px → bottom 21% cropped */}
        <div className="scroll-track flex gap-5 w-max">
          {[...EXAMPLE_CREATORS, ...EXAMPLE_CREATORS].map((c, i) => (
            <div
              key={i}
              className={`flex-shrink-0 w-[192px] rounded-[20px] bg-gradient-to-br ${c.gradient}`}
              style={{ height: '280px' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────── CREATOR SHOWCASE ─────────────────────── */
async function CreatorShowcase() {
  const supabase = await createClient()
  const [{ data: db }, { data: { user } }] = await Promise.all([
    supabase
      .from('influencer_profiles')
      .select('id, display_name, city, niche, reputation_score, content_packages(price_inr)')
      .eq('is_profile_live', true)
      .limit(8),
    supabase.auth.getUser(),
  ])

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

  function formatMinPrice(pkgs: { price_inr: number }[] | null): string {
    if (!pkgs || pkgs.length === 0) return '—'
    const min = Math.min(...pkgs.map(p => p.price_inr))
    return `₹${min.toLocaleString('en-IN')}`
  }

  const creators: Card[] = (db && db.length > 0)
    ? db.map((c, i) => ({
        id: c.id,
        display_name: c.display_name || 'Creator',
        city: c.city || 'India',
        niche: (c.niche as string[]) || [],
        followers: '—',
        price: formatMinPrice((c as { content_packages: { price_inr: number }[] | null }).content_packages),
        gradient: GRADIENTS[i % GRADIENTS.length],
        isReal: true,
        top: i < 2,
      }))
    : EXAMPLE_CREATORS.slice(0, 8).map(c => ({ ...c, isReal: false }))

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-2">Browse Creators</p>
            <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] leading-[0.9] uppercase">
              10,000+<br />
              <span className="text-[#45A905]">Verified Creators</span>
            </h2>
          </div>
          <Link
            href="/brand/discover"
            className="inline-flex items-center gap-2 bg-[#163300] text-[#9FE870] font-bold text-[15px] px-7 py-3.5 rounded-full hover:bg-[#1c4400] transition-colors flex-shrink-0"
          >
            See All Creators →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {creators.map((c) => (
            <Link
              key={c.id}
              href={user ? (c.isReal ? `/influencer/${c.id}` : '/brand/discover') : '/login'}
              className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#163300] rounded-[20px]"
            >
              <div className="bg-white rounded-[20px] overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200">
                {/* Thumbnail */}
                <div className={`h-[150px] bg-gradient-to-br ${c.gradient} relative flex items-center justify-center`}>
                  <span className="text-[52px] font-black text-white/10 select-none">{c.display_name[0]}</span>

                  {c.top && (
                    <span className="absolute top-3 left-3 bg-[#163300] text-[#9FE870] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                      Top Creator
                    </span>
                  )}

                  {c.followers !== '—' && (
                    <span className="absolute top-3 right-3 bg-black/35 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {c.followers}
                    </span>
                  )}

                  {/* Avatar */}
                  <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full bg-[#163300] border-4 border-white flex items-center justify-center text-[#9FE870] font-black text-[20px] z-10">
                    {c.display_name[0]}
                  </div>
                </div>

                {/* Info */}
                <div className="pt-11 px-4 pb-4">
                  <p className="text-[14px] font-bold text-[#121511] leading-tight mb-0.5">{c.display_name}</p>
                  <p className="text-[12px] text-[#6A6C6A] mb-3">
                    {c.city}{c.niche[0] ? ` · ${c.niche[0]}` : ''}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.niche.slice(0, 2).map((n: string) => (
                      <span key={n} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-bold">{n}</span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#6A6C6A] uppercase tracking-wide mb-0.5">Starting from</p>
                      <p className="text-[15px] font-black text-[#121511]">{c.price !== '—' ? c.price : '—'}</p>
                    </div>
                    <span className="text-[12px] font-bold text-[#121511] bg-[#EDEFEB] group-hover:bg-[#163300] group-hover:text-[#9FE870] px-3 py-1.5 rounded-full transition-colors flex-shrink-0">
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
    <section id="how-it-works" className="bg-white py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="mb-14">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-3">How It Works</p>
          <h2 className="text-[48px] md:text-[72px] font-black text-[#121511] uppercase leading-[0.88] max-w-[700px]">
            From brief to<br />
            <span className="text-[#45A905]">content in days.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E8E8] border border-[#E8E8E8] rounded-[24px] overflow-hidden">
          {[
            {
              n: '01',
              title: 'Post a Campaign',
              body: 'Write your brief, set your budget, choose your platform and niche. Ready in under 5 minutes.',
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
              body: 'Funds held in escrow. Creator delivers content. You approve — or it auto-releases after 72 hours.',
              metric: '100% Secure',
            },
          ].map((s) => (
            <div key={s.n} className="bg-white p-8 md:p-10">
              <span className="text-[72px] font-black text-[#121511] leading-none block">{s.n}</span>
              <h3 className="text-[22px] font-black text-[#121511] mt-4 mb-3">{s.title}</h3>
              <p className="text-[15px] text-[#6A6C6A] leading-relaxed">{s.body}</p>
              <div className="mt-8 pt-6 border-t border-[#E8E8E8]">
                <p className="text-[24px] font-black text-[#45A905]">{s.metric}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="bg-[#163300] text-[#9FE870] font-bold text-[16px] px-8 py-4 rounded-full hover:bg-[#1c4400] transition-colors"
          >
            Post a Campaign →
          </Link>
          <Link
            href="/creator"
            className="bg-[#EDEFEB] text-[#45A905] font-bold text-[16px] px-8 py-4 rounded-full hover:bg-[#e0e2de] transition-colors"
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
      quote: 'Finally a platform built for India. Got paid within 72 hours — no chasing, no back-and-forth over WhatsApp.',
      name: 'Rahul Sharma',
      role: 'Instagram Creator, 180K followers',
    },
    {
      quote: 'GST invoices are generated automatically for every order. Our finance team is happy and our campaign time is down by half.',
      name: 'Ankit Jain',
      role: 'Founder, Bangalore D2C Brand',
    },
  ]

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="mb-12">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-3">What People Say</p>
          <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] uppercase leading-[0.88]">
            Real results,<br />
            <span className="text-[#45A905]">real growth.</span>
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
            className="bg-[#9FE870] text-[#163300] font-bold text-[18px] px-12 py-5 rounded-full hover:bg-[#8fdc60] transition-colors"
          >
            Find Creators →
          </Link>
          <Link
            href="/creator"
            className="bg-white/10 text-white border border-white/20 font-bold text-[18px] px-12 py-5 rounded-full hover:bg-white/20 transition-colors"
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
    <footer className="bg-white border-t border-[#E8E8E8] px-5 md:px-[70px] py-[60px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-12 mb-14">
          {/* Brand */}
          <div>
            <p className="text-[22px] font-black text-[#163300] mb-2">Crayon</p>
            <p className="text-[14px] text-[#6A6C6A] leading-relaxed max-w-[280px]">
              India&rsquo;s influencer marketplace connecting brands with verified creators across all major platforms.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#45A905] mb-5">Platform</p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/brand/discover" className="text-[15px] text-[#6A6C6A] hover:text-[#45A905] transition-colors font-medium">
                  Find Creators
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-[15px] text-[#6A6C6A] hover:text-[#45A905] transition-colors font-medium">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[15px] text-[#6A6C6A] hover:text-[#45A905] transition-colors font-medium">
                  Pricing
                </Link>
              </li>
              <li>
                <span className="text-[15px] text-[#B0B2AF] font-medium cursor-default">Blog</span>
              </li>
            </ul>
          </div>

          {/* Join */}
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#45A905] mb-5">Join</p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/login" className="text-[15px] text-[#6A6C6A] hover:text-[#45A905] transition-colors font-medium">
                  Join as Brand
                </Link>
              </li>
              <li>
                <Link href="/onboarding/creator" className="text-[15px] text-[#6A6C6A] hover:text-[#45A905] transition-colors font-medium">
                  Join as Creator
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[15px] text-[#6A6C6A] hover:text-[#45A905] transition-colors font-medium">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E8E8E8] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#6A6C6A]">
          <span>© {new Date().getFullYear()} Crayon. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="text-[#B0B2AF] cursor-default">Privacy</span>
            <span className="text-[#B0B2AF] cursor-default">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
