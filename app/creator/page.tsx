import Link from 'next/link'
import {
  Check,
  Shield,
  Zap,
  Users,
  TrendingUp,
  CreditCard,
  MessageCircle,
  IndianRupee,
  Star,
  Smartphone,
  ChevronDown,
} from 'lucide-react'

export const metadata = {
  title: 'Earn Money as a Creator — Crayon',
  description:
    'Get paid to work with Indian brands you love. Join 10,000+ creators earning from brand collaborations on Instagram, YouTube, Moj & ShareChat — with zero contracts and UPI payouts.',
}

export default function CreatorPage() {
  return (
    <div className="overflow-x-hidden text-[#121511]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <style>{`
        @keyframes float-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes float-c { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .fa{animation:float-a 4s ease-in-out infinite}
        .fb{animation:float-b 4s ease-in-out 1.3s infinite}
        .fc{animation:float-c 4s ease-in-out 2.6s infinite}
        details summary { list-style: none; cursor: pointer; }
        details summary::-webkit-details-marker { display: none; }
        details[open] .faq-chevron { transform: rotate(180deg); }
        .faq-chevron { transition: transform 0.2s ease; }
      `}</style>
      <Hero />
      <SocialProof />
      <Platforms />
      <HowItWorks />
      <Benefits />
      <Earnings />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </div>
  )
}

/* ────────────── HERO ────────────── */
function Hero() {
  return (
    <section className="bg-[#163300] min-h-[92vh] flex items-center px-5 md:px-[70px] py-[80px] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 70% 50%, rgba(159,232,112,0.07) 0%, transparent 70%)' }}
      />

      <div className="max-w-[1360px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-14 items-center relative z-10">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/75 text-[13px] font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-[#9FE870] rounded-full" />
            10,000+ Indian creators already earning on Crayon
          </div>

          <h1 className="text-[62px] md:text-[86px] font-black leading-[0.88] uppercase tracking-tight text-white mb-6">
            Get Paid Doing<br />
            <span className="text-[#9FE870]">What You Love.</span>
          </h1>

          <p className="text-[17px] md:text-[19px] text-white/55 leading-relaxed max-w-[520px] mb-10">
            Turn your Instagram, YouTube, Moj or ShareChat following into a revenue stream. Brands come to you, pay upfront via escrow, and you keep full creative control.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              href="/onboarding/creator"
              className="bg-[#9FE870] text-[#163300] font-bold text-[17px] px-9 py-4 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Create My Profile Free →
            </Link>
            <Link
              href="#how-it-works"
              className="bg-white/10 text-white border border-white/20 font-bold text-[17px] px-9 py-4 rounded-full hover:bg-white/20 transition-colors"
            >
              See How It Works
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4">
            {[
              '₹0 to Join',
              '10% fee only on success',
              'UPI Payouts',
              'No contracts',
            ].map((b) => (
              <div key={b} className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-2">
                <Check className="w-3.5 h-3.5 text-[#9FE870] flex-shrink-0" />
                <span className="text-[13px] text-white/65 font-medium">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating payment notifications */}
        <div className="hidden lg:flex flex-col gap-5">
          {[
            { brand: 'Mamaearth', amount: '₹12,000', type: 'Instagram Reel', time: 'Just now', color: 'from-[#9FE870] to-[#163300]', cls: 'fa' },
            { brand: 'boAt Audio', amount: '₹28,500', type: 'YouTube Review', time: '2 min ago', color: 'from-violet-400 to-purple-700', cls: 'fb' },
            { brand: 'Nykaa', amount: '₹8,000', type: 'UGC Package', time: '5 min ago', color: 'from-pink-400 to-rose-600', cls: 'fc' },
          ].map((n, i) => (
            <div
              key={i}
              className={`bg-white rounded-[20px] p-5 shadow-xl ${n.cls}`}
              style={{ transform: `rotate(${[-1.5, 0.8, -0.6][i]}deg)` }}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${n.color} mb-4`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] text-[#6A6C6A] mb-0.5">Payment received from</p>
                  <p className="text-[16px] font-black text-[#121511]">{n.brand}</p>
                  <p className="text-[12px] text-[#6A6C6A] mt-1">{n.type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[22px] font-black text-[#163300]">{n.amount}</p>
                  <p className="text-[11px] text-[#6A6C6A] mt-1">{n.time}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center gap-2">
                <div className="w-2 h-2 bg-[#9FE870] rounded-full" />
                <span className="text-[12px] text-[#6A6C6A]">Sent to your UPI · Escrow released</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────── SOCIAL PROOF ────────────── */
function SocialProof() {
  return (
    <section className="bg-white border-b border-[#E8E8E8] py-[50px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { val: '10,000+', label: 'Active Creators' },
          { val: '₹2Cr+', label: 'Paid Out to Date' },
          { val: '4.8/5', label: 'Creator Rating' },
          { val: '72h', label: 'Avg Payout Time' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-[38px] font-black text-[#163300] leading-tight">{s.val}</p>
            <p className="text-[15px] text-[#6A6C6A] mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ────────────── PLATFORMS ────────────── */
function Platforms() {
  const platforms = [
    { name: 'Instagram', desc: 'Posts, Reels & Stories', color: 'from-pink-400 to-rose-500', followers: 'Any size' },
    { name: 'YouTube', desc: 'Long-form & Shorts', color: 'from-red-400 to-red-600', followers: 'Any size' },
    { name: 'Moj', desc: 'Short-form Videos', color: 'from-emerald-400 to-teal-600', followers: 'Any size' },
    { name: 'ShareChat', desc: 'Regional Language Content', color: 'from-blue-400 to-indigo-600', followers: 'Any size' },
    { name: 'UGC', desc: 'No following needed', color: 'from-[#9FE870] to-[#163300]', followers: '0 followers OK' },
  ]

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="max-w-[700px] mb-12">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">Platforms</p>
          <h2 className="text-[48px] md:text-[64px] font-black text-[#121511] uppercase leading-[0.88] mb-4">
            Monetize any<br />
            <span className="text-[#163300]">platform you&rsquo;re on.</span>
          </h2>
          <p className="text-[16px] text-[#6A6C6A] leading-relaxed">
            List your services across multiple platforms. Even if you have zero followers — UGC creators earn real money producing content for brands.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {platforms.map((p) => (
            <div key={p.name} className="bg-white rounded-[20px] overflow-hidden hover:-translate-y-1 transition-transform">
              <div className={`h-[100px] bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                <span className="text-[28px] font-black text-white/20 uppercase tracking-tight">{p.name[0]}</span>
              </div>
              <div className="p-4">
                <p className="text-[15px] font-black text-[#121511] mb-1">{p.name}</p>
                <p className="text-[12px] text-[#6A6C6A] mb-3">{p.desc}</p>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-[#EDEFEB] text-[#163300] rounded-full">
                  {p.followers}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────── HOW IT WORKS ────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Build Your Creator Profile',
      body: 'Set up your storefront in minutes. Add your platforms, set rates per content type (post, reel, story, video, UGC), and showcase your best work. Your Crayon profile IS your media kit.',
      tag: 'Setup Once',
      detail: 'Takes under 10 minutes',
    },
    {
      n: '02',
      title: 'Share Your Link & Get Discovered',
      body: 'Add your personal Crayon link to your bio. Brands discover you on our marketplace AND via your direct link. Zero cold pitching, zero DM spam, zero chasing.',
      tag: 'Inbound Only',
      detail: '10,000+ brands searching daily',
    },
    {
      n: '03',
      title: 'Accept, Create & Get Paid',
      body: 'Brands place an order with their brief. You review and accept (or decline — full freedom). Deliver the content. Funds release to your UPI automatically. Done.',
      tag: 'Escrow Protected',
      detail: 'Payout in 72 hours',
    },
  ]

  return (
    <section id="how-it-works" className="bg-white py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="max-w-[680px] mb-14">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">How It Works</p>
          <h2 className="text-[48px] md:text-[72px] font-black text-[#121511] uppercase leading-[0.88]">
            3 steps to your<br />
            <span className="text-[#9FE870] [-webkit-text-stroke:2px_#163300]">first brand deal.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E8E8] border border-[#E8E8E8] rounded-[24px] overflow-hidden">
          {steps.map((s) => (
            <div key={s.n} className="bg-white p-8 md:p-10">
              <span className="text-[72px] font-black text-[#9FE870] leading-none block">{s.n}</span>
              <span className="mt-3 mb-4 inline-block text-[11px] font-bold uppercase tracking-wider text-[#6A6C6A] bg-[#EDEFEB] px-3 py-1 rounded-full">
                {s.tag}
              </span>
              <h3 className="text-[22px] font-black text-[#121511] mb-3">{s.title}</h3>
              <p className="text-[15px] text-[#6A6C6A] leading-relaxed mb-6">{s.body}</p>
              <div className="pt-6 border-t border-[#E8E8E8]">
                <p className="text-[15px] font-bold text-[#163300]">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/onboarding/creator"
            className="inline-block bg-[#163300] text-[#9FE870] font-bold text-[16px] px-9 py-4 rounded-full hover:bg-[#1f4a00] transition-colors"
          >
            Start My Creator Profile →
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ────────────── BENEFITS ────────────── */
function Benefits() {
  const items = [
    {
      icon: Users,
      title: 'Brands Come to You',
      body: '10,000+ Indian brands actively search Crayon daily. Your profile works 24/7 generating inbound inquiries — no cold pitching ever.',
      metric: '10,000+',
      metricLabel: 'Brands on platform',
    },
    {
      icon: Shield,
      title: 'You Always Get Paid',
      body: 'Brands pay before work begins. Funds sit in escrow and release automatically when you deliver — or after 72h. No chasing, ever.',
      metric: '100%',
      metricLabel: 'Secure payments',
    },
    {
      icon: Zap,
      title: 'Accept or Decline Freely',
      body: 'Every order is your choice. Say yes to brands you love. Say no to anything that doesn\'t feel right. Zero pressure, zero penalties.',
      metric: 'Full',
      metricLabel: 'Creative freedom',
    },
    {
      icon: IndianRupee,
      title: 'Instant UPI Payouts',
      body: 'Get paid directly to your UPI ID or bank account. No PayPal, no wire transfers, no waiting. Indian money for Indian creators.',
      metric: '72h',
      metricLabel: 'Avg payout speed',
    },
    {
      icon: TrendingUp,
      title: 'GST & Invoices Handled',
      body: 'Every collaboration auto-generates a GST-compliant invoice. No paperwork, no CA visits, no Excel sheets. Completely automated.',
      metric: 'Auto',
      metricLabel: 'GST invoices',
    },
    {
      icon: Star,
      title: 'No Minimum Followers',
      body: 'UGC creators with zero followers earn on Crayon. Brands pay for quality content, not just reach. Even nano-creators make real money.',
      metric: '0',
      metricLabel: 'Minimum followers',
    },
  ]

  return (
    <section className="bg-[#163300] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="mb-14">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9FE870]/50 mb-3">Why Creators Choose Crayon</p>
          <h2 className="text-[48px] md:text-[68px] font-black text-white uppercase leading-[0.88]">
            Everything you need<br />
            <span className="text-[#9FE870]">to earn more.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((f) => (
            <div key={f.title} className="bg-white/[0.07] border border-white/[0.12] rounded-[24px] p-8 hover:bg-white/[0.11] transition-colors">
              <div className="w-12 h-12 bg-[#9FE870]/15 rounded-full flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-[#9FE870]" />
              </div>
              <h3 className="text-[20px] font-black text-white mb-3">{f.title}</h3>
              <p className="text-[14px] text-white/55 leading-relaxed mb-6">{f.body}</p>
              <div className="pt-5 border-t border-white/10">
                <p className="text-[44px] font-black text-[#9FE870] leading-none">{f.metric}</p>
                <p className="text-[13px] text-white/40 mt-1">{f.metricLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────── EARNINGS ────────────── */
function Earnings() {
  const tiers = [
    {
      name: 'UGC Creator',
      range: '0 followers',
      perPost: '₹1,500 – ₹10,000',
      perMonth: '₹15,000 – ₹80,000',
      gradient: 'from-[#9FE870] to-[#5cba30]',
      tag: 'No audience needed',
    },
    {
      name: 'Nano Creator',
      range: '1K – 10K followers',
      perPost: '₹2,000 – ₹8,000',
      perMonth: '₹20,000 – ₹60,000',
      gradient: 'from-teal-400 to-emerald-600',
      tag: 'Growing fast',
    },
    {
      name: 'Micro Creator',
      range: '10K – 100K followers',
      perPost: '₹5,000 – ₹30,000',
      perMonth: '₹40,000 – ₹2,00,000',
      gradient: 'from-sky-400 to-blue-600',
      tag: 'Most in demand',
    },
    {
      name: 'Mid-Tier Creator',
      range: '100K – 500K followers',
      perPost: '₹20,000 – ₹1,00,000',
      perMonth: '₹1,50,000 – ₹8,00,000',
      gradient: 'from-violet-400 to-purple-700',
      tag: 'Premium rates',
    },
    {
      name: 'Macro Creator',
      range: '500K+ followers',
      perPost: '₹75,000 – ₹5,00,000',
      perMonth: '₹5,00,000+',
      gradient: 'from-orange-400 to-red-600',
      tag: 'Top earnings',
    },
  ]

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">Earning Potential</p>
            <h2 className="text-[48px] md:text-[64px] font-black text-[#121511] uppercase leading-[0.88]">
              What creators<br />
              <span className="text-[#163300]">earn on Crayon.</span>
            </h2>
          </div>
          <div className="bg-white rounded-[20px] px-6 py-4 flex items-center gap-3 self-start md:self-auto">
            <div className="w-10 h-10 bg-[#163300] rounded-full flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5 text-[#9FE870]" />
            </div>
            <div>
              <p className="text-[15px] font-black text-[#163300]">Avg first payout</p>
              <p className="text-[13px] text-[#6A6C6A]">within 7 days of joining</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className="bg-white rounded-[20px] overflow-hidden">
              <div className={`h-[90px] bg-gradient-to-br ${t.gradient} relative flex items-end p-4`}>
                <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">{t.tag}</span>
              </div>
              <div className="p-5">
                <p className="text-[15px] font-black text-[#121511] mb-1">{t.name}</p>
                <p className="text-[12px] text-[#6A6C6A] mb-4">{t.range}</p>
                <div className="border-t border-[#F0F0F0] pt-4">
                  <p className="text-[11px] text-[#6A6C6A] uppercase tracking-wider mb-1">Per content piece</p>
                  <p className="text-[15px] font-black text-[#163300]">{t.perPost}</p>
                  <p className="text-[11px] text-[#6A6C6A] uppercase tracking-wider mt-3 mb-1">Per month potential</p>
                  <p className="text-[14px] font-black text-[#9FE870] [-webkit-text-stroke:0.5px_#163300]">{t.perMonth}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[13px] text-[#6A6C6A] text-center">
          Estimates based on average Indian market rates. Actual earnings depend on engagement, content quality and negotiation.
        </p>
      </div>
    </section>
  )
}

/* ────────────── TESTIMONIALS ────────────── */
function Testimonials() {
  const testimonials = [
    {
      quote: 'Got my first paid collab within 3 days of creating my profile. The brand paid upfront — I didn\'t have to chase anyone. Exactly how it should be.',
      name: 'Shreya Kapoor',
      role: 'Instagram Creator, 45K followers · Fashion',
      earned: '₹8,500 first deal',
    },
    {
      quote: 'I\'m a UGC creator with no following. Crayon let me earn from Day 1 — no one cared about my follower count, just the quality of my content.',
      name: 'Aditya Nair',
      role: 'UGC Creator · Product Photography',
      earned: '₹24,000 first month',
    },
    {
      quote: 'The platform handles GST invoices automatically. As someone who was doing this manually on Excel, this alone saved me 3 hours a month.',
      name: 'Pooja Menon',
      role: 'YouTube Creator, 210K subscribers · Tech',
      earned: '₹1.2L/month avg',
    },
  ]

  return (
    <section className="bg-white py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">Creator Stories</p>
            <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] uppercase leading-[0.88]">
              Real creators,<br />
              <span className="text-[#163300]">real earnings.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-[#EDEFEB] rounded-full px-6 py-3 self-start md:self-auto">
            <span className="text-[#9FE870] text-[22px] leading-none">★★★★★</span>
            <div>
              <p className="text-[17px] font-black text-[#163300] leading-tight">4.8/5</p>
              <p className="text-[12px] text-[#6A6C6A]">from 1,200+ reviews</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-[#EDEFEB] rounded-[24px] p-8 flex flex-col">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#9FE870] text-[#9FE870]" />
                ))}
              </div>
              <p className="text-[17px] text-[#121511] leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-5 border-t border-[#D8DAD6]">
                <div className="w-10 h-10 bg-[#163300] rounded-full flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                  {t.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-[#121511] truncate">{t.name}</p>
                  <p className="text-[12px] text-[#6A6C6A] truncate">{t.role}</p>
                </div>
                <span className="flex-shrink-0 text-[12px] font-black text-[#163300] bg-[#9FE870] px-3 py-1 rounded-full">
                  {t.earned}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ────────────── FAQ ────────────── */
function FAQ() {
  const faqs = [
    {
      q: 'Is it free to join Crayon as a creator?',
      a: 'Yes, completely free. Crayon only takes a 10% transaction fee when you successfully complete an order. No subscription, no monthly fee, no upfront cost. You only pay when you earn.',
    },
    {
      q: 'Do I need a minimum number of followers?',
      a: 'No minimum. UGC creators with zero followers are welcome and actively earn on Crayon. Brands pay for quality content — not just reach. If you can produce great photos, videos, or reels, you can earn.',
    },
    {
      q: 'How and when do I get paid?',
      a: 'Funds are held in escrow when a brand places an order. Once you deliver and the brand approves the content, payment is released to your UPI ID or bank account within 72 hours. If the brand doesn\'t respond, it auto-approves after 72h.',
    },
    {
      q: 'Can I reject orders I don\'t want?',
      a: 'Absolutely. Every order is a choice. You can accept or decline any brand brief — no penalties, no questions asked. Full creative and commercial freedom.',
    },
    {
      q: 'Do I need to sign a contract with brands?',
      a: 'No contracts required. Crayon\'s platform agreement covers the collaboration legally for both sides. The entire workflow — brief, delivery, approval, payment — happens inside the platform.',
    },
    {
      q: 'How long does profile approval take?',
      a: 'Most profiles are reviewed within 1–3 business days. You\'ll be notified by email once approved or if we need any additional information.',
    },
    {
      q: 'Are GST invoices handled for me?',
      a: 'Yes. Every completed collaboration automatically generates a GST-compliant invoice for both you and the brand. No manual invoicing, no spreadsheets.',
    },
    {
      q: 'Which platforms can I list services for?',
      a: 'Instagram (posts, reels, stories), YouTube (videos, shorts), Moj, ShareChat, and UGC (content delivery without posting to your own audience). More platforms coming soon.',
    },
  ]

  return (
    <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-14 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-3">FAQ</p>
            <h2 className="text-[48px] font-black text-[#121511] uppercase leading-[0.88] mb-6">
              Your questions<br />
              <span className="text-[#163300]">answered.</span>
            </h2>
            <p className="text-[16px] text-[#6A6C6A] leading-relaxed mb-8">
              Still have questions? We&rsquo;re happy to help.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#163300] text-[#9FE870] font-bold text-[15px] px-7 py-3.5 rounded-full hover:bg-[#1f4a00] transition-colors"
            >
              Contact Support →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <details key={i} className="bg-white rounded-[16px] overflow-hidden group">
                <summary className="flex items-center justify-between gap-4 p-6 select-none">
                  <span className="text-[16px] font-bold text-[#121511]">{f.q}</span>
                  <ChevronDown className="w-5 h-5 text-[#6A6C6A] flex-shrink-0 faq-chevron" />
                </summary>
                <div className="px-6 pb-6 text-[15px] text-[#6A6C6A] leading-relaxed border-t border-[#F0F0F0] pt-4">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ────────────── FINAL CTA ────────────── */
function FinalCTA() {
  return (
    <section className="bg-[#163300] py-[100px] px-5 md:px-[70px]">
      <div className="max-w-[1360px] mx-auto text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#9FE870]/50 mb-4">Start Earning</p>
        <h2 className="text-[56px] md:text-[88px] font-black text-white uppercase leading-[0.88] mb-6">
          Your next brand deal<br />
          <span className="text-[#9FE870]">is waiting.</span>
        </h2>
        <p className="text-[18px] text-white/55 mb-10 max-w-[460px] mx-auto">
          Join 10,000+ Indian creators already earning on Crayon. Free to join. No contracts. No minimums.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/onboarding/creator"
            className="bg-[#9FE870] text-[#163300] font-bold text-[18px] px-12 py-5 rounded-full hover:bg-[#8fdc60] transition-colors"
          >
            Create My Profile Free →
          </Link>
          <Link
            href="/brand/discover"
            className="bg-white/10 text-white border border-white/20 font-bold text-[18px] px-12 py-5 rounded-full hover:bg-white/20 transition-colors"
          >
            Browse Open Campaigns
          </Link>
        </div>

        {/* Bottom stat bar */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 border-t border-white/10 pt-14">
          {[
            ['₹0', 'To Join'],
            ['10%', 'Fee on Success Only'],
            ['72h', 'Payout Speed'],
            ['0', 'Minimum Followers'],
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
