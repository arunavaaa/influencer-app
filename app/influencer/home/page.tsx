'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ChevronRight, X, Clock, AlertCircle, CheckCircle,
  IndianRupee, Copy, Check, Package, TrendingUp,
  Compass, ClipboardList, Zap, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ─────────────────────────────────────────── */
type Profile = {
  id: string
  display_name: string
  profile_photo_url: string | null
  bio: string | null
  profile_title: string | null
  niche: string[] | null
  portfolio_urls: string[] | null
  upi_id: string | null
  bank_account_no: string | null
}

type Contract = {
  id: string
  status: string
  agreed_price_inr: number
  hired_at: string | null
  accepted_at: string | null
  auto_approve_at: string | null
  brand_profiles: { company_name: string; logo_url: string | null } | null
  content_packages: { format: string; platform: string; delivery_days: number } | null
}

type Campaign = {
  id: string
  title: string
  budget_inr: number | null
  target_niche: string[] | null
  content_format: string[] | null
  deadline: string | null
  brand_profiles: { company_name: string; logo_url: string | null } | null
}

/* ─── Helpers ─────────────────────────────────────── */
function getHour() { return new Date().getHours() }
function greeting(name: string) {
  const h = getHour()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name}`
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

function fmtDeadline(contract: Contract): string | null {
  if (contract.status === 'content_submitted' && contract.auto_approve_at) {
    const d = daysLeft(contract.auto_approve_at)
    if (d === null) return null
    if (d <= 0) return 'Auto-approving soon'
    return `Auto-approves in ${d}d`
  }
  if (contract.status === 'accepted' && contract.accepted_at && contract.content_packages?.delivery_days) {
    const due = new Date(contract.accepted_at)
    due.setDate(due.getDate() + contract.content_packages.delivery_days)
    const d = daysLeft(due.toISOString())
    if (d === null) return null
    if (d < 0) return 'Overdue'
    if (d === 0) return 'Due today'
    return `Due in ${d}d`
  }
  return null
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  pending_acceptance: { label: 'Hire request', dot: 'bg-[#9FE870]' },
  accepted: { label: 'In progress', dot: 'bg-blue-500' },
  content_submitted: { label: 'Under review', dot: 'bg-yellow-500' },
  revision_requested: { label: 'Revision needed', dot: 'bg-orange-500' },
  counter_offered: { label: 'Counter sent', dot: 'bg-purple-500' },
}

function ProfileCompletion({ profile }: { profile: Profile }) {
  const checks = [
    { done: !!profile.profile_photo_url, label: 'Add profile photo', href: '/influencer/profile/edit' },
    { done: !!profile.bio?.trim(), label: 'Write a bio', href: '/influencer/profile/edit' },
    { done: !!profile.profile_title?.trim(), label: 'Add profile title', href: '/influencer/profile/edit' },
    { done: (profile.niche ?? []).length > 0, label: 'Select your niches', href: '/influencer/profile/edit' },
    { done: (profile.portfolio_urls ?? []).length > 0, label: 'Upload portfolio', href: '/influencer/profile/edit' },
    { done: !!(profile.upi_id || profile.bank_account_no), label: 'Add payout details', href: '/influencer/settings' },
  ]
  const done = checks.filter(c => c.done).length
  const pct = Math.round((done / checks.length) * 100)
  const missing = checks.filter(c => !c.done)

  return (
    <div className="bg-white rounded-[20px] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-black text-[#121511]">Profile strength</p>
        <span className={`text-[13px] font-black ${pct === 100 ? 'text-[#163300]' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#EDEFEB] mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-[#9FE870]' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 100 && (
        <div className="space-y-1.5">
          {missing.slice(0, 3).map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 text-[12px] text-[#6A6C6A] hover:text-[#163300] transition-colors group"
            >
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#D0D2CF] flex-shrink-0 group-hover:border-[#163300] transition-colors" />
              {item.label}
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
          {missing.length > 3 && (
            <p className="text-[11px] text-[#B0B2AF] pl-5">+{missing.length - 3} more to complete</p>
          )}
        </div>
      )}
      {pct === 100 && (
        <p className="text-[12px] text-[#163300] font-semibold">Profile is 100% complete ✓</p>
      )}
    </div>
  )
}

function WelcomeBanner() {
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(searchParams.get('welcome') === 'true')
  if (!visible) return null
  return (
    <div className="bg-[#163300] rounded-[20px] p-5 mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[16px] font-black text-white mb-1">Your profile is live on Crayon!</p>
        <p className="text-[13px] text-white/60">Brands can now discover and hire you.</p>
      </div>
      <button onClick={() => setVisible(false)} className="text-white/40 hover:text-white flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────── */
export default function InfluencerHome() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [matchedCampaigns, setMatchedCampaigns] = useState<Campaign[]>([])
  const [pendingApplications, setPendingApplications] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: p } = await supabase
      .from('influencer_profiles')
      .select('id, display_name, profile_photo_url, bio, profile_title, niche, portfolio_urls, upi_id, bank_account_no')
      .eq('user_id', user.id)
      .single()

    if (!p) { setLoading(false); return }
    setProfile(p as Profile)

    const [contractsRes, appsRes, campaignsRes] = await Promise.all([
      supabase.from('contracts')
        .select('id, status, agreed_price_inr, hired_at, accepted_at, auto_approve_at, brand_profiles(company_name, logo_url), content_packages(format, platform, delivery_days)')
        .eq('influencer_id', p.id)
        .order('hired_at', { ascending: false }),
      supabase.from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('influencer_id', p.id)
        .eq('status', 'pending'),
      supabase.from('campaigns')
        .select('id, title, budget_inr, target_niche, content_format, deadline, brand_profiles(company_name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    setContracts((contractsRes.data || []) as unknown as Contract[])
    setPendingApplications(appsRes.count || 0)

    // Filter to campaigns matching creator's niche (or show all if no niche set)
    const allCampaigns = (campaignsRes.data || []) as unknown as Campaign[]
    const creatorNiches = p.niche || []
    const matched = creatorNiches.length > 0
      ? allCampaigns.filter(c => (c.target_niche || []).some(n => creatorNiches.includes(n)))
      : allCampaigns
    setMatchedCampaigns((matched.length >= 2 ? matched : allCampaigns).slice(0, 3))

    setLoading(false)
  }

  function copyProfileLink() {
    if (!profile) return
    const url = `${window.location.origin}/brand/creators/${profile.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Profile link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#163300] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const firstName = profile.display_name?.split(' ')[0] || 'Creator'
  const completed = contracts.filter(c => ['approved', 'auto_approved'].includes(c.status))
  const activeDeals = contracts.filter(c => ['accepted', 'content_submitted', 'revision_requested'].includes(c.status))
  const pendingOffers = contracts.filter(c => c.status === 'pending_acceptance')
  const allActive = [...pendingOffers, ...activeDeals]

  const totalEarned = completed.reduce((s, c) => s + Math.round(c.agreed_price_inr * 0.9), 0)
  const avgDealValue = completed.length > 0 ? Math.round(totalEarned / completed.length) : 0

  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
  const thisWeekEarned = completed
    .filter(c => c.hired_at && new Date(c.hired_at) >= weekStart)
    .reduce((s, c) => s + Math.round(c.agreed_price_inr * 0.9), 0)

  const isNew = contracts.length === 0

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      <div className="px-8 py-8 max-w-[1000px]">

        <Suspense fallback={null}><WelcomeBanner /></Suspense>

        {/* ── HERO STRIP ── */}
        <div className="bg-[#163300] rounded-[24px] p-6 mb-6 flex items-center justify-between gap-6">
          <div>
            <p className="text-[13px] font-semibold text-white/50 mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-[26px] font-black text-white leading-tight">{greeting(firstName)}</h1>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {totalEarned > 0 && (
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#9FE870]" />
                  <span className="text-[13px] font-bold text-white">
                    {thisWeekEarned > 0 ? `₹${thisWeekEarned.toLocaleString('en-IN')} this week` : `₹${totalEarned.toLocaleString('en-IN')} earned`}
                  </span>
                </div>
              )}
              {pendingOffers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9FE870] animate-pulse" />
                  <span className="text-[13px] font-bold text-[#9FE870]">
                    {pendingOffers.length} hire {pendingOffers.length === 1 ? 'request' : 'requests'} waiting
                  </span>
                </div>
              )}
              {isNew && (
                <span className="text-[13px] text-white/60">Your profile is live. Start applying to campaigns.</span>
              )}
            </div>
          </div>
          {!isNew && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[32px] font-black text-[#9FE870] leading-none">₹{totalEarned.toLocaleString('en-IN')}</p>
              <p className="text-[12px] text-white/50 mt-1">lifetime earnings (net)</p>
            </div>
          )}
        </div>

        {/* ── STATS ROW ── */}
        {!isNew && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active deals', value: activeDeals.length, Icon: Package, href: '/influencer/orders', accent: activeDeals.length > 0 },
              { label: 'Pending applications', value: pendingApplications, Icon: ClipboardList, href: '/influencer/applications', accent: false },
              { label: 'Completed deals', value: completed.length, Icon: CheckCircle, href: '/influencer/orders', accent: false },
              { label: 'Avg deal value', value: avgDealValue > 0 ? `₹${avgDealValue.toLocaleString('en-IN')}` : '—', Icon: TrendingUp, href: '/influencer/earnings', accent: false },
            ].map(({ label, value, Icon, href, accent }) => (
              <Link
                key={label}
                href={href}
                className={`bg-white rounded-[20px] p-5 flex flex-col gap-2 hover:shadow-sm transition-shadow group ${accent ? 'ring-2 ring-[#9FE870]' : ''}`}
              >
                <Icon className={`w-4 h-4 ${accent ? 'text-[#163300]' : 'text-[#B0B2AF]'}`} />
                <p className={`text-[24px] font-black leading-none ${accent ? 'text-[#163300]' : 'text-[#121511]'}`}>{value}</p>
                <p className="text-[11px] text-[#6A6C6A] leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Action required alert */}
            {pendingOffers.length > 0 && (
              <Link
                href="/influencer/orders"
                className="flex items-center gap-4 bg-[#9FE870] rounded-[20px] p-5 hover:bg-[#8fd960] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-[#163300]" />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-black text-[#163300]">
                    {pendingOffers.length} hire {pendingOffers.length === 1 ? 'request' : 'requests'} waiting for your response
                  </p>
                  <p className="text-[12px] text-[#163300]/70">Accept or decline within 48 hours</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#163300] flex-shrink-0" />
              </Link>
            )}

            {/* Active Deals */}
            {allActive.length > 0 ? (
              <div className="bg-white rounded-[24px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-black text-[#121511]">Active Deals</h2>
                  <Link href="/influencer/orders" className="text-[12px] font-semibold text-[#163300] hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-[#F4F4F4]">
                  {allActive.slice(0, 4).map(contract => {
                    const s = STATUS_MAP[contract.status]
                    const deadline = fmtDeadline(contract)
                    const isUrgent = deadline?.includes('today') || deadline?.includes('Overdue') || deadline?.includes('soon')
                    return (
                      <Link
                        key={contract.id}
                        href={`/influencer/orders/${contract.id}`}
                        className="flex items-center gap-3 py-3.5 -mx-6 px-6 hover:bg-[#EDEFEB] transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[12px] font-black flex-shrink-0 overflow-hidden">
                          {contract.brand_profiles?.logo_url
                            ? <img src={contract.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                            : (contract.brand_profiles?.company_name?.[0] || 'B').toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#121511] truncate">
                            {contract.brand_profiles?.company_name || '—'}
                          </p>
                          <p className="text-[11px] text-[#6A6C6A] capitalize">
                            {[contract.content_packages?.format, `₹${contract.agreed_price_inr.toLocaleString('en-IN')}`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          {s && (
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              <span className="text-[11px] font-semibold text-[#121511]">{s.label}</span>
                            </div>
                          )}
                          {deadline && (
                            <p className={`text-[10px] font-bold ${isUrgent ? 'text-red-500' : 'text-[#B0B2AF]'}`}>
                              {deadline}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#B0B2AF] flex-shrink-0 ml-1" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : !isNew ? (
              <div className="bg-white rounded-[24px] p-6 text-center">
                <Package className="w-8 h-8 text-[#D0D2CF] mx-auto mb-3" />
                <p className="text-[14px] font-bold text-[#121511] mb-1">No active deals</p>
                <p className="text-[13px] text-[#6A6C6A]">Apply to campaigns to start earning.</p>
                <Link href="/influencer/campaigns" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#163300] hover:underline">
                  <Compass className="w-4 h-4" /> Discover campaigns
                </Link>
              </div>
            ) : null}

            {/* Matched Campaigns */}
            <div className="bg-white rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[16px] font-black text-[#121511]">Matched Campaigns</h2>
                  <p className="text-[12px] text-[#6A6C6A] mt-0.5">Based on your niche and profile</p>
                </div>
                <Link href="/influencer/campaigns" className="text-[12px] font-semibold text-[#163300] hover:underline">
                  Discover more →
                </Link>
              </div>
              {matchedCampaigns.length === 0 ? (
                <div className="text-center py-6">
                  <Compass className="w-8 h-8 text-[#D0D2CF] mx-auto mb-2" />
                  <p className="text-[13px] text-[#6A6C6A]">No active campaigns right now. Check back soon.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedCampaigns.map(c => (
                    <Link
                      key={c.id}
                      href="/influencer/campaigns"
                      className="flex items-center gap-3 p-4 rounded-[14px] bg-[#EDEFEB] hover:bg-[#E5E8E1] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#163300] text-[12px] font-black flex-shrink-0 overflow-hidden shadow-sm">
                        {c.brand_profiles?.logo_url
                          ? <img src={c.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                          : (c.brand_profiles?.company_name?.[0] || 'B').toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#121511] truncate">{c.title}</p>
                        <p className="text-[11px] text-[#6A6C6A]">
                          {c.brand_profiles?.company_name || '—'}
                          {c.budget_inr ? ` · ₹${c.budget_inr.toLocaleString('en-IN')}` : ''}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {c.content_format?.map(f => (
                          <span key={f} className="text-[10px] font-bold bg-white text-[#163300] px-2 py-0.5 rounded-full capitalize">
                            {f}
                          </span>
                        ))}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#B0B2AF] flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* New creator getting started */}
            {isNew && (
              <div className="bg-white rounded-[24px] p-6">
                <h2 className="text-[16px] font-black text-[#121511] mb-4">Getting started</h2>
                <div className="space-y-3">
                  {[
                    { Icon: CheckCircle, title: 'Profile is live', desc: 'Brands can discover and hire you.', done: true, href: null },
                    { Icon: Zap, title: 'Complete your profile', desc: 'A complete profile gets 3× more hires.', done: false, href: '/influencer/profile/edit' },
                    { Icon: Compass, title: 'Apply to campaigns', desc: 'Browse campaigns that match your niche.', done: false, href: '/influencer/campaigns' },
                  ].map(({ Icon, title, desc, done, href }) => (
                    <div key={title} className={`flex items-start gap-3 p-4 rounded-[14px] ${done ? 'bg-[#EDEFEB]' : 'bg-[#EDEFEB] border-2 border-[#9FE870]/30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-[#9FE870]' : 'bg-white border-2 border-[#E8E8E8]'}`}>
                        <Icon className={`w-4 h-4 ${done ? 'text-[#163300]' : 'text-[#6A6C6A]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#121511]">{title}</p>
                        <p className="text-[12px] text-[#6A6C6A]">{desc}</p>
                      </div>
                      {href && (
                        <Link href={href} className="text-[12px] font-bold text-[#163300] hover:underline flex-shrink-0">
                          Go →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Profile strength */}
            <ProfileCompletion profile={profile} />

            {/* Upcoming deadlines */}
            {allActive.length > 0 && (
              <div className="bg-white rounded-[20px] p-5">
                <h3 className="text-[13px] font-black text-[#121511] mb-3">Upcoming Deadlines</h3>
                <div className="space-y-2">
                  {allActive
                    .map(c => ({ contract: c, deadline: fmtDeadline(c) }))
                    .filter(({ deadline }) => !!deadline)
                    .slice(0, 4)
                    .map(({ contract, deadline }) => {
                      const isUrgent = deadline?.includes('today') || deadline?.includes('Overdue')
                      return (
                        <Link
                          key={contract.id}
                          href={`/influencer/orders/${contract.id}`}
                          className="flex items-center gap-2.5 p-2.5 rounded-[10px] hover:bg-[#EDEFEB] transition-colors"
                        >
                          <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isUrgent ? 'text-red-500' : 'text-[#B0B2AF]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-[#121511] truncate">
                              {contract.brand_profiles?.company_name || '—'}
                            </p>
                            <p className={`text-[11px] font-bold ${isUrgent ? 'text-red-500' : 'text-[#6A6C6A]'}`}>
                              {deadline}
                            </p>
                          </div>
                        </Link>
                      )
                    })
                  }
                  {allActive.filter(c => !fmtDeadline(c)).length > 0 && allActive.every(c => !fmtDeadline(c)) && (
                    <p className="text-[12px] text-[#B0B2AF] text-center py-2">No upcoming deadlines</p>
                  )}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-[20px] p-5">
              <h3 className="text-[13px] font-black text-[#121511] mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                {[
                  { Icon: Compass, label: 'Discover campaigns', href: '/influencer/campaigns' },
                  { Icon: ClipboardList, label: 'View applications', href: '/influencer/applications' },
                  { Icon: IndianRupee, label: 'Check payments', href: '/influencer/earnings' },
                ].map(({ Icon, label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-[#121511] transition-colors"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Profile link */}
            <div className="bg-white rounded-[20px] p-5">
              <p className="text-[12px] font-black text-[#121511] mb-1">Your public profile</p>
              <p className="text-[11px] text-[#6A6C6A] mb-3">Share to get direct hire requests from brands.</p>
              <button
                onClick={copyProfileLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#EDEFEB] text-[#163300] text-[13px] font-bold hover:bg-[#9FE870] transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy profile link'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
