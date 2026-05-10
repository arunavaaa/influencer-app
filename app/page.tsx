import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: "Crayon — India's Influencer Marketplace",
  description:
    'Find and hire verified Indian creators. Pay securely via escrow. GST invoices included. The Collabstr for India.',
}

export default async function Landing() {
  return (
    <div className="text-[#121511]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeaturedCreators />
      <Testimonials />
      <FooterCta />
      <Footer />
    </div>
  )
}

/* ──────────────────────────────────────────────
   HERO
────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="bg-[#163300] text-white py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="max-w-[600px] mx-auto text-center">
          <h1
            className="text-[48px] md:text-[72px] font-black leading-[1] uppercase tracking-tight text-[#9FE870]"
          >
            India&rsquo;s Influencer Marketplace
          </h1>
          <p className="mt-6 text-[18px] text-white/80 leading-relaxed">
            Find verified Indian creators on Instagram, YouTube, Moj &amp; ShareChat.
            Pay securely via escrow. GST invoices included.
          </p>

          {/* Search bar */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 bg-white/10 border border-white/20 rounded-[24px] p-2">
            <select
              className="bg-transparent text-white text-[15px] font-medium px-4 py-3 rounded-[20px] focus:outline-none focus:bg-white/10 cursor-pointer flex-shrink-0"
              defaultValue=""
            >
              <option value="" className="text-black bg-white">Any Platform</option>
              <option value="instagram" className="text-black bg-white">Instagram</option>
              <option value="youtube" className="text-black bg-white">YouTube</option>
              <option value="moj" className="text-black bg-white">Moj</option>
              <option value="sharechat" className="text-black bg-white">ShareChat</option>
            </select>
            <input
              type="text"
              placeholder="Search by niche, category or keyword..."
              className="flex-1 bg-transparent text-white placeholder-white/50 text-[15px] px-4 py-3 focus:outline-none"
            />
            <Link
              href="/brand/discover"
              className="bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-3 rounded-[20px] whitespace-nowrap hover:bg-[#8fdc60] transition-colors"
            >
              Search
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-[#9FE870] text-[#163300] font-bold text-[16px] px-10 py-4 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              I&rsquo;m a Brand — Find Creators
            </Link>
            <Link
              href="/login"
              className="bg-transparent text-white border-2 border-white/30 font-bold text-[16px] px-10 py-4 rounded-full hover:bg-white/10 transition-colors"
            >
              Join as Influencer
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   STATS BAR
────────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { value: '10,000+', label: 'Verified Creators' },
    { value: '₹0', label: 'to Browse' },
    { value: 'Escrow', label: 'Protected Payments' },
    { value: 'GST', label: 'Invoices Included' },
  ]
  return (
    <section className="bg-white border-b border-[#E8E8E8] py-[50px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[37px] font-black text-[#163300] leading-tight">{s.value}</p>
            <p className="text-[16px] text-[#6A6C6A] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   HOW IT WORKS
────────────────────────────────────────────── */
function HowItWorks() {
  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          {/* For Brands */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-4">For Brands</p>
            <h2 className="text-[37px] font-black text-[#121511] leading-tight mb-10">
              Get Content Shipped
            </h2>
            <div className="flex flex-col gap-8">
              {[
                { n: '01', title: 'Post a Campaign', body: 'Share your brief, set your budget, and define niche, platform, and creator tier.' },
                { n: '02', title: 'Review Applications', body: 'Vetted creators apply with their pitch and price. Pick the right ones, chat in-app.' },
                { n: '03', title: 'Pay Securely', body: 'Funds sit in escrow until you approve content. Auto-approves after 72h if no response.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-6 items-start">
                  <span className="text-[48px] font-black text-[#9FE870] leading-none w-[60px] flex-shrink-0">{s.n}</span>
                  <div>
                    <h3 className="text-[20px] font-bold text-[#121511] mb-1">{s.title}</h3>
                    <p className="text-[16px] text-[#6A6C6A] leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/login"
              className="mt-10 inline-block bg-[#163300] text-[#9FE870] font-bold text-[16px] px-10 py-4 rounded-full hover:bg-[#1f4a00] transition-colors"
            >
              I&rsquo;m a Brand →
            </Link>
          </div>

          {/* For Influencers */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-4">For Influencers</p>
            <h2 className="text-[37px] font-black text-[#121511] leading-tight mb-10">
              Get Paid for Your Work
            </h2>
            <div className="flex flex-col gap-8">
              {[
                { n: '01', title: 'Create Your Profile', body: 'Show your niche, packages, and best content. Set your rates per format and platform.' },
                { n: '02', title: 'Apply to Campaigns', body: 'Browse open briefs from verified Indian brands. Pitch the ones that fit your audience.' },
                { n: '03', title: 'Get Paid', body: 'Submit content. Brand reviews in 72h, or it auto-approves and your payout is released.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-6 items-start">
                  <span className="text-[48px] font-black text-[#9FE870] leading-none w-[60px] flex-shrink-0">{s.n}</span>
                  <div>
                    <h3 className="text-[20px] font-bold text-[#121511] mb-1">{s.title}</h3>
                    <p className="text-[16px] text-[#6A6C6A] leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/login"
              className="mt-10 inline-block bg-[#9FE870] text-[#163300] font-bold text-[16px] px-10 py-4 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Join as Influencer →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   FEATURED CREATORS (live from Supabase)
────────────────────────────────────────────── */
async function FeaturedCreators() {
  const supabase = await createClient()
  const { data: creators } = await supabase
    .from('influencer_profiles')
    .select('id, display_name, city, niche, reputation_score')
    .eq('is_profile_live', true)
    .limit(6)

  const AVATAR_COLORS = [
    'bg-[#9FE870] text-[#163300]',
    'bg-[#163300] text-[#9FE870]',
    'bg-[#EDEFEB] text-[#163300]',
    'bg-[#121511] text-white',
    'bg-[#9FE870] text-[#163300]',
    'bg-[#163300] text-[#9FE870]',
  ]

  return (
    <section className="bg-white py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-2">Featured</p>
            <h2 className="text-[37px] font-black text-[#121511]">Top Creators</h2>
          </div>
          <Link
            href="/brand/discover"
            className="text-[16px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors"
          >
            See All →
          </Link>
        </div>

        {creators && creators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px]">
            {creators.map((creator, i) => (
              <Link key={creator.id} href={`/influencer/${creator.id}`}>
                <div className="bg-white border border-[#E8E8E8] rounded-[24px] p-[20px] hover:-translate-y-1 transition-transform cursor-pointer group">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {creator.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#121511] tracking-tight mb-0.5">
                    {creator.display_name}
                  </h3>
                  <p className="text-[14px] text-[#6A6C6A] mb-3">{creator.city || 'India'}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {creator.niche?.slice(0, 3).map((n: string) => (
                      <span key={n} className="text-[12px] px-3 py-1 bg-[#EDEFEB] text-[#163300] font-medium rounded-full">
                        {n}
                      </span>
                    ))}
                  </div>
                  {creator.reputation_score > 0 && (
                    <div className="flex items-center gap-1 text-[14px] text-[#6A6C6A]">
                      <span className="text-[#9FE870]">★</span>
                      <span className="font-semibold text-[#121511]">{creator.reputation_score}</span>
                      <span>reputation score</span>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
                    <span className="text-[16px] font-bold text-[#163300] group-hover:text-[#9FE870] transition-colors">
                      View Profile →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#6A6C6A] text-[18px]">Creators are joining every day.</p>
            <Link
              href="/login"
              className="mt-6 inline-block bg-[#9FE870] text-[#163300] font-bold text-[16px] px-10 py-4 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Join as a Creator
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   TESTIMONIALS
────────────────────────────────────────────── */
function Testimonials() {
  const testimonials = [
    {
      quote: "Found 3 Instagram creators in 2 days. The escrow gave us peace of mind — we only paid after approving the content.",
      name: "Priya Mehta",
      role: "Marketing Head, D2C Brand",
    },
    {
      quote: "Finally a platform that understands Indian influencers. Got paid within 72 hours, no negotiation hassle.",
      name: "Rahul Sharma",
      role: "Instagram Creator, 180K followers",
    },
    {
      quote: "GST invoices auto-generated for every order. Our finance team loves it. Campaign management is 10x faster now.",
      name: "Ankit Jain",
      role: "Founder, Bangalore D2C Brand",
    },
  ]

  return (
    <section className="bg-[#163300] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <h2 className="text-[48px] md:text-[60px] font-black text-[#9FE870] uppercase text-center mb-12 leading-tight">
          Don&rsquo;t Just Take Our Word For It
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-[24px] p-10">
              <p className="text-[18px] text-[#121511] leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-bold text-[16px] text-[#163300]">{t.name}</p>
                <p className="text-[14px] text-[#6A6C6A]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   FOOTER CTA
────────────────────────────────────────────── */
function FooterCta() {
  return (
    <section className="bg-[#163300] py-[80px] px-5 md:px-[70px] border-t border-white/10">
      <div className="max-w-[1360px] mx-auto text-center">
        <h2 className="text-[48px] md:text-[60px] font-black text-white uppercase leading-tight mb-6">
          Find &amp; Hire Influencers
        </h2>
        <p className="text-[18px] text-white/70 mb-10 max-w-[500px] mx-auto">
          Post your first campaign in under 5 minutes. Pay only when you&rsquo;re happy with the content.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-[#9FE870] text-[#163300] font-bold text-[18px] px-12 py-5 rounded-full hover:bg-[#8fdc60] transition-colors"
          >
            Search Influencers
          </Link>
          <Link
            href="/login"
            className="bg-transparent text-white border-2 border-white/30 font-bold text-[18px] px-12 py-5 rounded-full hover:bg-white/10 transition-colors"
          >
            Join as Creator
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────
   FOOTER
────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-white border-t border-[#E8E8E8] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto py-[80px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Resources</p>
            <ul className="flex flex-col gap-3">
              {['Pricing', 'Blog', 'Resource Hub', '2026 Influencer Report', 'Brand Stories'].map((l) => (
                <li key={l}><Link href="/login" className="text-[16px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Tools</p>
            <ul className="flex flex-col gap-3">
              {['Price Calculator', 'Engagement Rate Calculator', 'Campaign Brief Template', 'Influencer Contract Template'].map((l) => (
                <li key={l}><Link href="/login" className="text-[16px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Discover</p>
            <ul className="flex flex-col gap-3">
              {['Find Influencers', 'Top Creators', 'Search by Platform', 'Search by Niche'].map((l) => (
                <li key={l}><Link href="/brand/discover" className="text-[16px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#0E0F0C] mb-4">Support</p>
            <ul className="flex flex-col gap-3">
              {['Contact Us', 'How It Works', 'FAQ'].map((l) => (
                <li key={l}><Link href="/login" className="text-[16px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>
              ))}
            </ul>
            <div className="mt-8">
              <p className="text-[20px] font-black text-[#163300]">Crayon</p>
              <p className="text-[14px] text-[#6A6C6A] mt-1">India&rsquo;s Influencer Marketplace</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#E8E8E8] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#6A6C6A]">
          <span>© {new Date().getFullYear()} Crayon. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#163300] transition-colors">Privacy</Link>
            <Link href="/login" className="hover:text-[#163300] transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-[#163300] transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
