import Link from 'next/link'
import Image from 'next/image'
import { AnimatedStat } from '@/components/ui/animated-stat'
import { FloatingHearts } from '@/components/ui/floating-hearts'

export const metadata = {
  title: "GrabCollab — Hire Indian Content Creators",
  description: "Post a campaign, discover Indian creators across Instagram, YouTube, Facebook, X and more, and hire the perfect match for your brand.",
}

const CREATOR_IMAGES = [
  'ananya-sharma', 'priya-kapoor', 'rahul-verma', 'meera-nair',
  'arjun-singh', 'kavya-reddy', 'rohit-mehta', 'sneha-iyer',
  'vikram-rao', 'aisha-khan', 'dev-patel', 'riya-gupta',
  'aditya-kumar', 'pooja-sharma', 'kiran-das', 'nikhil-joshi',
  'shreya-pillai',
]

const CREATOR_STATS = [
  { impressions: 12_400_000, likes:  890_000 },
  { impressions:  3_800_000, likes:  245_000 },
  { impressions:  8_200_000, likes:  612_000 },
  { impressions:  5_600_000, likes:  423_000 },
  { impressions: 19_300_000, likes: 1_400_000 },
  { impressions:  2_900_000, likes:  198_000 },
  { impressions:  7_100_000, likes:  534_000 },
  { impressions:  4_400_000, likes:  312_000 },
  { impressions: 23_700_000, likes: 2_100_000 },
  { impressions:  6_800_000, likes:  487_000 },
  { impressions:  4_100_000, likes:  298_000 },
  { impressions:  9_500_000, likes:  723_000 },
  { impressions: 14_200_000, likes: 1_100_000 },
  { impressions:  3_200_000, likes:  221_000 },
  { impressions: 11_600_000, likes:  845_000 },
  { impressions:  5_100_000, likes:  378_000 },
  { impressions:  7_900_000, likes:  567_000 },
]

export default async function Landing() {
  return (
    <div className="text-[#121511] overflow-x-hidden" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>

      {/* Hero */}
      <section className="bg-[#163300] overflow-hidden relative">

        {/* ── Layer 1: hearts BEHIND images ── */}
        <FloatingHearts layer="back" />

        {/* Text + CTAs — always above both heart layers */}
        <div className="relative max-w-[900px] mx-auto text-center px-5 md:px-10 pt-[100px] pb-12" style={{ zIndex: 10 }}>
          <h1 className="text-[56px] md:text-[88px] font-black leading-[0.88] uppercase tracking-tight text-white mb-4">
            Find Indian<br /><span className="text-[#9FE870]">Creators</span><br />for Your Brand
          </h1>
          <p className="text-[18px] text-white/60 leading-relaxed max-w-[520px] mx-auto mb-10">
            Post a campaign, discover creators across all platforms, and hire the perfect match — all in one place for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding/brand" className="bg-[#9FE870] text-[#163300] font-bold text-[17px] px-10 py-4 rounded-full hover:bg-[#8fdc60] transition-colors">Post a Campaign →</Link>
            <Link href="/brand/search" className="bg-white/10 border border-white/20 text-white font-bold text-[17px] px-10 py-4 rounded-full hover:bg-white/20 transition-colors">Browse Creators</Link>
          </div>
        </div>

        {/* ── Image strip — sits BETWEEN the two heart layers (z-index 5) ── */}
        {/* Scrolling creator portrait strip — bottom 30% bleeds below hero edge */}
        <div className="relative mt-10" style={{ marginBottom: '-140px', zIndex: 5 }}>
          <div className="flex" style={{ gap: '24px', width: 'max-content', animation: 'marquee 40s linear infinite' }}>
            {[...CREATOR_IMAGES, ...CREATOR_IMAGES].map((name, i) => {
              const stats = CREATOR_STATS[i % CREATOR_STATS.length]
              return (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-[20px] overflow-hidden relative"
                  style={{ width: '264px', height: '468px' }}
                >
                  <Image
                    src={`/influencers/${name}.png`}
                    alt=""
                    width={264}
                    height={468}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Stats overlay — top-right, animated counters */}
                  <div className="absolute top-3 right-3 flex flex-row gap-1.5">
                    <AnimatedStat
                      icon="👁"
                      maxValue={stats.impressions}
                      phase={(i % CREATOR_STATS.length) / CREATOR_STATS.length}
                      duration={9000 + (i % 7) * 900}
                    />
                    <AnimatedStat
                      icon="❤️"
                      maxValue={stats.likes}
                      phase={((i % CREATOR_STATS.length) / CREATOR_STATS.length + 0.4) % 1}
                      duration={10500 + (i % 5) * 700}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Layer 2: hearts IN FRONT of images — the "bypass gap" ones ── */}
        <FloatingHearts layer="front" />

      </section>

      {/* Featured creators */}
      <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1360px] mx-auto">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-2">Browse Creators</p>
              <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] leading-[0.9] uppercase">Top Creators<br /><span className="text-[#45A905]">on GrabCollab</span></h2>
            </div>
            <Link href="/brand/search" className="inline-flex items-center gap-2 bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1c4400] transition-colors flex-shrink-0">See All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Zara Khan',        handle: '@zarakhan',        city: 'Mumbai',    niche: 'Fashion & Beauty',   platform: 'Instagram', followers: '245K', avatar: 'from-pink-400 to-rose-600' },
              { name: 'SidTheWanderer',   handle: '@sidthewanderer',  city: 'Goa',       niche: 'Travel & Vlogs',     platform: 'YouTube',   followers: '189K', avatar: 'from-sky-400 to-blue-600' },
              { name: 'Meera R.',         handle: '@meerawellness',   city: 'Bangalore', niche: 'Wellness & Fitness', platform: 'Instagram', followers: '92K',  avatar: 'from-emerald-400 to-teal-600' },
              { name: 'BeWithNik',        handle: '@bewithnik',       city: 'Delhi',     niche: 'Comedy & Memes',     platform: 'Instagram', followers: '418K', avatar: 'from-amber-400 to-orange-500' },
              { name: 'Divya Menon',      handle: '@divyaeats',       city: 'Chennai',   niche: 'Food & Cooking',     platform: 'Instagram', followers: '68K',  avatar: 'from-orange-400 to-red-500' },
              { name: 'Arnav.Lens',       handle: '@arnavlens',       city: 'Jaipur',    niche: 'Photography & Art',  platform: 'Instagram', followers: '134K', avatar: 'from-violet-400 to-purple-700' },
            ].map((c) => (
              <Link key={c.handle} href="/onboarding/brand" className="group bg-white rounded-[20px] p-4 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200">
                {/* Avatar + name row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${c.avatar} flex-shrink-0 flex items-center justify-center text-white font-black text-[17px] shadow-sm`}>
                    {c.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] leading-tight truncate">{c.name}</p>
                    <p className="text-[12px] text-[#9A9C9A] truncate">{c.handle} · {c.city}</p>
                  </div>
                </div>
                {/* Niche + followers on one line */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-[11px] font-semibold bg-[#EDEFEB] text-[#163300] px-2.5 py-1 rounded-full">{c.niche}</span>
                  <span className="text-[11px] text-[#6A6C6A]">{c.followers} {c.platform === 'YouTube' ? 'subscribers' : 'followers'}</span>
                </div>
                {/* Footer */}
                <div className="border-t border-[#F0F0F0] pt-3 flex justify-end">
                  <span className="text-[11px] font-bold text-[#163300] bg-[#EDEFEB] group-hover:bg-[#163300] group-hover:text-[#9FE870] px-3 py-1.5 rounded-full transition-colors">View profile →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1360px] mx-auto">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-3">How It Works</p>
          <h2 className="text-[48px] md:text-[68px] font-black text-[#121511] uppercase leading-[0.88] mb-14 max-w-[600px]">Hire a creator<br /><span className="text-[#45A905]">in minutes.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[14px] font-bold uppercase tracking-widest text-[#163300] mb-5">For Brands</p>
              <div className="space-y-4">
                {['Post a campaign brief', 'Review creator applications', 'Shortlist & chat with creators', 'Select your creator & collaborate'].map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#163300] text-[#9FE870] font-black text-[14px] flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <p className="text-[16px] font-semibold text-[#121511]">{s}</p>
                  </div>
                ))}
              </div>
              <Link href="/onboarding/brand" className="mt-8 inline-block bg-[#163300] text-[#9FE870] font-bold text-[15px] px-8 py-4 rounded-full hover:bg-[#1c4400] transition-colors">Join as Brand →</Link>
            </div>
            <div>
              <p className="text-[14px] font-bold uppercase tracking-widest text-[#163300] mb-5">For Creators</p>
              <div className="space-y-4">
                {['Create your free profile in 5 minutes', 'Browse brand campaigns', 'Apply with your cover note & rate', 'Get selected & start collaborating'].map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#9FE870] text-[#163300] font-black text-[14px] flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <p className="text-[16px] font-semibold text-[#121511]">{s}</p>
                  </div>
                ))}
              </div>
              <Link href="/onboarding/creator" className="mt-8 inline-block bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-4 rounded-full hover:bg-[#8fdc60] transition-colors">Join as Creator →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#163300] py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1360px] mx-auto flex flex-wrap justify-center gap-x-16 gap-y-8">
          {[['500+','Creators'],['100+','Brands'],['5+','Platforms'],['Free','To Join']].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-[52px] font-black text-[#9FE870] leading-none">{v}</p>
              <p className="text-[14px] text-white/50 mt-2">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-[100px] px-5 md:px-[70px] text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-[52px] md:text-[72px] font-black text-[#121511] uppercase leading-[0.88] mb-6">Start finding creators today.</h2>
          <p className="text-[18px] text-[#6A6C6A] mb-10">It&rsquo;s completely free to post a campaign and browse creators.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/brand/search" className="bg-[#163300] text-[#9FE870] font-bold text-[17px] px-10 py-4 rounded-full hover:bg-[#1c4400] transition-colors">Search Creators →</Link>
            <Link href="/brand/campaigns/new" className="bg-[#EDEFEB] text-[#163300] font-bold text-[17px] px-10 py-4 rounded-full hover:bg-[#E0E2DE] transition-colors">Post a Campaign</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E8E8] px-5 md:px-[70px] py-[60px]">
        <div className="max-w-[1360px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="text-[20px] font-black text-[#163300] mb-2">GrabCollab</p>
              <p className="text-[14px] text-[#6A6C6A] leading-relaxed">India&rsquo;s creator hiring portal — connecting brands with creators across Instagram, YouTube, Facebook & more.</p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#45A905] mb-4">Platform</p>
              <ul className="space-y-2.5">{[['Search Creators','/brand/search'],['Post Campaign','/brand/campaigns/new'],['How It Works','/#how-it-works']].map(([l,h]) => <li key={l}><Link href={h} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>)}</ul>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#45A905] mb-4">For Creators</p>
              <ul className="space-y-2.5">{[['Join as Creator','/onboarding/creator'],['Browse Campaigns','/onboarding/creator'],['Creator Landing','/for-creators']].map(([l,h]) => <li key={l}><Link href={h} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>)}</ul>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#45A905] mb-4">Company</p>
              <ul className="space-y-2.5">{[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Login','/login']].map(([l,h]) => <li key={l}><Link href={h} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>)}</ul>
            </div>
          </div>
          <div className="border-t border-[#E8E8E8] pt-6 flex items-center justify-between text-[13px] text-[#6A6C6A]">
            <span>© 2026 GrabCollab. All rights reserved.</span>
            <span>Made in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
