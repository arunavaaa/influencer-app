'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { Megaphone, Users, Zap, MessageSquare, ChevronRight, Lock, Plus } from 'lucide-react'

type Campaign = {
  id: string
  title: string
  status: string
  budget_inr: number | null
  deadline: string | null
  target_niche: string[] | null
  required_format: string[] | null
  created_at: string
  application_count?: number
}

const BENEFITS = [
  { Icon: Megaphone, title: 'Post your brief once', desc: 'Describe your campaign and let creators come to you. No cold outreach needed.' },
  { Icon: Users, title: 'Get creator applications', desc: 'Receive pitches from relevant creators who want to work with your brand.' },
  { Icon: MessageSquare, title: 'Chat before you hire', desc: 'Message applicants, review portfolios, and shortlist your favourites.' },
  { Icon: Zap, title: 'Run 3 campaigns at once', desc: 'Pro plan includes 3 active campaigns per month. Scale gets unlimited.' },
]

const MOCK_CAMPAIGNS = [
  { title: 'Summer Collection Launch', applications: 14, budget: '₹50,000', status: 'Active', niches: ['Fashion', 'Lifestyle'] },
  { title: 'Product Review — Protein Powder', applications: 9, budget: '₹20,000', status: 'Active', niches: ['Fitness', 'Food'] },
  { title: 'App Install Drive', applications: 31, budget: '₹1,00,000', status: 'Active', niches: ['Tech', 'Gaming'] },
]

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-[#EDEFEB] text-[#6A6C6A]',
  draft: 'bg-blue-50 text-blue-600',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CampaignsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tier, setTier] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .single()

      if (!brand) { setLoading(false); return }
      setTier(brand.subscription_tier)

      if (brand.subscription_tier === 'free') { setLoading(false); return }

      const { data } = await supabase
        .from('campaigns')
        .select('id, title, status, budget_inr, deadline, target_niche, required_format, created_at')
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false })

      // fetch application counts per campaign
      const list = (data || []) as Campaign[]
      const withCounts = await Promise.all(list.map(async c => {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', c.id)
        return { ...c, application_count: count || 0 }
      }))
      setCampaigns(withCounts)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#163300] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── FREE TIER — upgrade gate ──────────────────────────────
  if (tier === 'free') {
    return (
      <div className="min-h-screen bg-[#EDEFEB]">
        {showUpgrade && <UpgradeModal trigger="campaigns" onClose={() => setShowUpgrade(false)} />}

        <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-[28px] font-black text-[#121511]">Campaigns</h1>
                <span className="px-2 py-0.5 rounded-full bg-[#163300] text-[#9FE870] text-[11px] font-black uppercase tracking-wide">Pro</span>
              </div>
              <p className="text-[15px] text-[#6A6C6A]">Post briefs and receive applications from creators</p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-[#9FE870] text-[#163300] text-[14px] font-black hover:bg-[#8fd960] transition-colors"
            >
              <Lock className="w-4 h-4" />
              Unlock Campaigns
            </button>
          </div>
        </div>

        <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-10">
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
            <div>
              <p className="text-[13px] font-bold text-[#9FE870] uppercase tracking-widest mb-3">Available on Pro & Scale</p>
              <h2 className="text-[36px] font-black text-[#121511] leading-tight mb-4">Let creators apply<br />to work with you</h2>
              <p className="text-[16px] text-[#6A6C6A] mb-8 leading-relaxed">Post a campaign brief with your goals, budget, and niche. Creators who match will send you pitches — you pick the best fit.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {BENEFITS.map(({ Icon, title, desc }) => (
                  <div key={title} className="bg-white rounded-[20px] p-5">
                    <div className="w-9 h-9 rounded-full bg-[#9FE870] flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-[#163300]" />
                    </div>
                    <p className="text-[15px] font-bold text-[#121511] mb-1">{title}</p>
                    <p className="text-[13px] text-[#6A6C6A] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                className="inline-flex items-center gap-2 bg-[#163300] text-[#9FE870] font-black text-[16px] px-8 py-4 rounded-[14px] hover:bg-[#1f4a00] transition-colors"
              >
                Upgrade to post campaigns
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-[12px] text-[#6A6C6A] mt-3">Starts at ₹499/month · Cancel anytime · GST applicable</p>
            </div>

            <div className="relative">
              <div className="bg-white rounded-[24px] overflow-hidden border border-[#E8E8E8]">
                <div className="px-6 py-4 border-b border-[#E8E8E8] bg-[#EDEFEB]">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4">
                    {['Campaign', 'Applications', 'Budget', 'Status'].map(h => (
                      <p key={h} className="text-[11px] font-bold uppercase tracking-wider text-[#6A6C6A]">{h}</p>
                    ))}
                  </div>
                </div>
                {MOCK_CAMPAIGNS.map((c, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-[#E8E8E8] last:border-0 items-center">
                    <div>
                      <p className="text-[14px] font-bold text-[#121511]">{c.title}</p>
                      <div className="flex gap-1 mt-1">
                        {c.niches.map(n => (
                          <span key={n} className="text-[10px] px-2 py-0.5 bg-[#EDEFEB] text-[#163300] font-semibold rounded-full">{n}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[14px] font-bold text-[#121511]">{c.applications}</p>
                    <p className="text-[14px] text-[#6A6C6A]">{c.budget}</p>
                    <span className="text-[12px] font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full inline-block">{c.status}</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white/90 rounded-[24px] flex items-end justify-center pb-8">
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-2 bg-[#163300] text-[#9FE870] font-black text-[14px] px-6 py-3 rounded-[12px] hover:bg-[#1f4a00] transition-colors shadow-lg"
                >
                  <Lock className="w-4 h-4" />
                  Unlock to post campaigns
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PRO / SCALE — real campaigns UI ──────────────────────
  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[28px] font-black text-[#121511]">Campaigns</h1>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide ${tier === 'scale' ? 'bg-[#163300] text-[#9FE870]' : 'bg-[#9FE870] text-[#163300]'}`}>
                {tier}
              </span>
            </div>
            <p className="text-[15px] text-[#6A6C6A]">Post briefs and receive applications from creators</p>
          </div>
          <Link
            href="/brand/campaigns/new"
            className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-black hover:bg-[#1f4a00] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-[24px] p-16 text-center">
            <Megaphone className="w-10 h-10 text-[#D0D2CF] mx-auto mb-4" />
            <p className="text-[18px] font-black text-[#121511] mb-2">No campaigns yet</p>
            <p className="text-[14px] text-[#6A6C6A] mb-6">Post your first campaign brief and start receiving creator applications.</p>
            <Link
              href="/brand/campaigns/new"
              className="inline-flex items-center gap-2 bg-[#163300] text-[#9FE870] font-black text-[14px] px-6 py-3 rounded-[12px] hover:bg-[#1f4a00] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] overflow-hidden border border-[#E8E8E8]">
            <div className="px-6 py-4 border-b border-[#E8E8E8] bg-[#EDEFEB]">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4">
                {['Campaign', 'Applications', 'Budget', 'Deadline', 'Status'].map(h => (
                  <p key={h} className="text-[11px] font-bold uppercase tracking-wider text-[#6A6C6A]">{h}</p>
                ))}
              </div>
            </div>
            {campaigns.map(c => (
              <Link
                key={c.id}
                href={`/brand/campaigns/${c.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-[#E8E8E8] last:border-0 items-center hover:bg-[#EDEFEB] transition-colors"
              >
                <div>
                  <p className="text-[14px] font-bold text-[#121511]">{c.title}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(c.target_niche || []).slice(0, 2).map(n => (
                      <span key={n} className="text-[10px] px-2 py-0.5 bg-[#EDEFEB] text-[#163300] font-semibold rounded-full">{n}</span>
                    ))}
                  </div>
                </div>
                <p className="text-[14px] font-bold text-[#121511]">{c.application_count ?? 0}</p>
                <p className="text-[14px] text-[#6A6C6A]">{c.budget_inr ? `₹${c.budget_inr.toLocaleString('en-IN')}` : '—'}</p>
                <p className="text-[13px] text-[#6A6C6A]">{fmtDate(c.deadline)}</p>
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full inline-block capitalize ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}>
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
