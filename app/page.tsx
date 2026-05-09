import Link from 'next/link'
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  HandshakeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
  UsersRoundIcon,
  WalletIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

export const metadata = {
  title: "India's Influencer Marketplace — Crayon",
  description:
    'Connect with verified creators. Pay securely. Grow faster. Crayon is the two-sided marketplace for India brands and influencers.',
}

export default function Landing() {
  return (
    <div className="bg-[#FBF8F3] text-[#1B1814]">
      <Hero />
      <StatsStrip />
      <HowItWorks
        title="For brands"
        eyebrow="Get content shipped"
        steps={[
          {
            number: '01',
            title: 'Post a campaign',
            body:
              'Share the brief, set a budget, and pick the niche, platform, and creator tier you need.',
            icon: SparklesIcon,
          },
          {
            number: '02',
            title: 'Review applications',
            body:
              'Vetted creators apply with their pitch and proposed price. Pick the right ones, message in-app.',
            icon: UsersRoundIcon,
          },
          {
            number: '03',
            title: 'Pay securely',
            body:
              'Funds sit in escrow until you approve the content. Approve, request revisions, or release the payout — your call.',
            icon: ShieldCheckIcon,
          },
        ]}
        ctaLabel="I'm a Brand"
        accent="brand"
      />
      <HowItWorks
        title="For influencers"
        eyebrow="Get paid for your work"
        steps={[
          {
            number: '01',
            title: 'Create your profile',
            body:
              'Show your niche, packages, and best work. Set your rates per format and platform.',
            icon: BadgeCheckIcon,
          },
          {
            number: '02',
            title: 'Apply to campaigns',
            body:
              'Browse open briefs from verified Indian brands. Pitch the ones that fit your audience.',
            icon: HandshakeIcon,
          },
          {
            number: '03',
            title: 'Get paid',
            body:
              'Submit content. Brand has 72 hours to review, or it auto-approves and your payout is released.',
            icon: WalletIcon,
          },
        ]}
        ctaLabel="Join as Influencer"
        accent="influencer"
      />
      <FinalCta />
      <Footer />
    </div>
  )
}

/* ---------- HERO ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* warm radial gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, #FFE5D0 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 40%, #FCE4DA 0%, transparent 70%), #FBF8F3',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-[#1B1814]/15 to-transparent"
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 pb-24 sm:pb-32">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1B1814]/15 bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-[#1B1814]/80">
            <span className="size-1.5 rounded-full bg-[#E8632A]" />
            Built for India · Mumbai-hosted
          </span>

          <h1
            className="mt-6 text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[1.05] font-[family-name:var(--font-fraunces)]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            India&rsquo;s Influencer
            <br />
            <em className="not-italic font-light">Marketplace.</em>
          </h1>

          <p className="mt-6 max-w-xl text-lg sm:text-xl text-[#4F4942] leading-relaxed">
            Connect with verified creators. Pay securely. Grow faster.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="bg-[#1B1814] hover:bg-[#2A2520] text-white rounded-full h-12 px-7 text-base font-medium"
            >
              <Link href="/login">
                I&rsquo;m a Brand
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full h-12 px-7 text-base font-medium border-[#1B1814]/20 bg-white/80 hover:bg-white"
            >
              <Link href="/login">Join as Influencer</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-[#1B1814]/50">
            Free to join. No commission until you complete a deal.
          </p>
        </div>

        {/* Floating campaign card mockup */}
        <div className="relative mt-20 sm:mt-24 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampaignMock
              brand="Mamaearth"
              title="Summer skincare reel"
              budget="₹50,000"
              tags={['Beauty', 'Reel']}
              tilt="-rotate-1"
            />
            <CampaignMock
              brand="Boat"
              title="Headphones unboxing"
              budget="₹35,000"
              tags={['Tech', 'YouTube']}
              tilt=""
              featured
            />
            <CampaignMock
              brand="Nykaa"
              title="GRWM Festive look"
              budget="₹80,000"
              tags={['Fashion', 'Reel']}
              tilt="rotate-1"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function CampaignMock({
  brand,
  title,
  budget,
  tags,
  tilt,
  featured,
}: {
  brand: string
  title: string
  budget: string
  tags: string[]
  tilt: string
  featured?: boolean
}) {
  return (
    <div
      className={`bg-white border border-[#1B1814]/8 rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(27,24,20,0.04),0_24px_48px_-12px_rgba(27,24,20,0.08)] ${tilt} ${featured ? 'sm:-translate-y-3 sm:scale-[1.03]' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="size-10 rounded-full bg-[#1B1814]/8 flex items-center justify-center text-sm font-semibold">
          {brand[0]}
        </div>
        {featured && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#E8632A]">
            New
          </span>
        )}
      </div>
      <p className="text-xs text-[#4F4942] mb-1">{brand}</p>
      <h3 className="font-medium text-[15px] mb-3 leading-snug">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full bg-[#FBF8F3] text-[#1B1814]/70"
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-sm font-semibold">{budget}</span>
      </div>
    </div>
  )
}

/* ---------- STATS ---------- */

function StatsStrip() {
  const stats = [
    { value: '500+', label: 'Verified Influencers' },
    { value: '₹0', label: 'Commission to start' },
    { value: 'Escrow', label: 'Protected payouts' },
  ]
  return (
    <section className="bg-[#1B1814] text-white py-12 sm:py-14">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-6 sm:py-2 text-center">
            <p
              className="text-4xl sm:text-5xl font-[family-name:var(--font-fraunces)] tracking-tight"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              {s.value}
            </p>
            <p className="text-sm text-white/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- HOW IT WORKS ---------- */

type Step = {
  number: string
  title: string
  body: string
  icon: React.ComponentType<{ className?: string }>
}

function HowItWorks({
  title,
  eyebrow,
  steps,
  ctaLabel,
  accent,
}: {
  title: string
  eyebrow: string
  steps: Step[]
  ctaLabel: string
  accent: 'brand' | 'influencer'
}) {
  return (
    <section className="py-24 sm:py-32 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#E8632A] font-medium mb-3">
              {eyebrow}
            </p>
            <h2
              className="text-4xl sm:text-5xl font-[family-name:var(--font-fraunces)] tracking-tight"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
            >
              {title}
            </h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-full self-start sm:self-end border-[#1B1814]/20 bg-white"
          >
            <Link href="/login">
              {ctaLabel}
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.number}
                className="group relative rounded-2xl border border-[#1B1814]/10 bg-white p-7 hover:border-[#1B1814]/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="size-11 rounded-xl bg-[#1B1814] text-white flex items-center justify-center">
                    <Icon className="size-5" />
                  </div>
                  <span
                    className="text-3xl font-[family-name:var(--font-fraunces)] text-[#1B1814]/15"
                    style={{ fontVariationSettings: '"opsz" 144' }}
                  >
                    {s.number}
                  </span>
                </div>
                <h3 className="text-xl font-medium mb-2 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-[15px] text-[#4F4942] leading-relaxed">
                  {s.body}
                </p>
                {accent === 'brand' && (
                  <div className="absolute inset-x-7 -bottom-px h-px bg-gradient-to-r from-transparent via-[#E8632A]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- FINAL CTA ---------- */

function FinalCta() {
  return (
    <section className="px-6 sm:px-8 pb-24">
      <div className="max-w-6xl mx-auto rounded-3xl bg-[#1B1814] text-white p-10 sm:p-16 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 70% at 90% 50%, rgba(232, 99, 42, 0.25) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-2xl">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-[family-name:var(--font-fraunces)] tracking-tight leading-[1.05]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
          >
            Ship your next campaign{' '}
            <em className="not-italic font-light text-white/85">this week.</em>
          </h2>
          <p className="mt-5 text-lg text-white/75 leading-relaxed">
            Post your first brief in under 5 minutes. Pay only when you&rsquo;re
            happy with the content.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="bg-[#E8632A] hover:bg-[#D5571F] text-white rounded-full h-12 px-7 text-base font-medium"
            >
              <Link href="/login">
                I&rsquo;m a Brand
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full h-12 px-7 text-base font-medium bg-transparent border-white/25 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">
                <UploadCloudIcon className="size-4" />
                Join as Influencer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- FOOTER ---------- */

function Footer() {
  return (
    <footer className="border-t border-[#1B1814]/10 bg-[#FBF8F3]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-[family-name:var(--font-fraunces)]"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            Crayon
          </span>
          <span className="text-sm text-[#1B1814]/50">
            India&rsquo;s influencer marketplace
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[#1B1814]/60">
          <Link href="/login" className="hover:text-[#1B1814] transition-colors">
            Sign in
          </Link>
          <span>·</span>
          <span>
            © {new Date().getFullYear()} Crayon. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
