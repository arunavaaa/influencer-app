'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Search, Megaphone, Library, BarChart2, Package,
  LogOut, ArrowRight, X, ChevronRight, AlertCircle,
  Clock, CheckCircle, Users, TrendingUp, CreditCard,
} from 'lucide-react'

type Order = {
  id: string
  agreed_price_inr: number
  status: string
  hired_at: string | null
  influencer_profiles: {
    id: string
    display_name: string
    profile_photo_url: string | null
  } | null
  content_packages: {
    format: string
    platform: string
  } | null
}

type Creator = {
  id: string
  display_name: string
  profile_photo_url: string | null
  niche: string[] | null
  city: string | null
  reputation_score: number | null
  social_accounts: { follower_count: number | null }[] | null
}

type BrandProfile = {
  id: string
  company_name: string
  logo_url: string | null
  company_description: string | null
  website_url: string | null
  instagram_handle: string | null
  interested_categories: string[] | null
  company_city: string | null
}

const NAV_ITEMS = [
  { href: '/brand/home', icon: Home, label: 'Home' },
  { href: '/brand/discover', icon: Search, label: 'Discover' },
  { href: '/brand/orders', icon: Package, label: 'Orders' },
  { href: '/brand/campaigns', icon: Megaphone, label: 'Campaigns' },
  { href: '/brand/library', icon: Library, label: 'Library' },
  { href: '/brand/track', icon: BarChart2, label: 'Track' },
  { href: '/brand/billing', icon: CreditCard, label: 'Billing' },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_acceptance: { label: 'Awaiting', color: 'text-yellow-600 bg-yellow-50' },
  accepted: { label: 'In progress', color: 'text-blue-600 bg-blue-50' },
  content_submitted: { label: 'Review needed', color: 'text-[#163300] bg-[#9FE870]/20' },
  revision_requested: { label: 'Revision sent', color: 'text-orange-600 bg-orange-50' },
  approved: { label: 'Completed', color: 'text-green-700 bg-green-50' },
  auto_approved: { label: 'Completed', color: 'text-green-700 bg-green-50' },
  declined: { label: 'Declined', color: 'text-red-600 bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-[#6A6C6A] bg-[#EDEFEB]' },
}

function getProfileCompletion(p: BrandProfile) {
  const checks = [
    { label: 'Upload your logo', done: !!p.logo_url },
    { label: 'Add a brand description', done: !!p.company_description },
    { label: 'Add website or Instagram handle', done: !!(p.website_url || p.instagram_handle) },
    { label: 'Select content categories', done: !!(p.interested_categories?.length) },
    { label: 'Add your company location', done: !!p.company_city },
  ]
  const done = checks.filter(c => c.done).length
  return {
    pct: Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.label),
  }
}

function fmtFollowers(n: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

export default function BrandHome() {
  const supabase = createClient()
  const pathname = usePathname()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [recommended, setRecommended] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)

  useEffect(() => {
    fetchData()
    try {
      if (localStorage.getItem('brand_nudge_dismissed')) setNudgeDismissed(true)
    } catch { /* ignore */ }
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('brand_profiles')
      .select('id, company_name, logo_url, company_description, website_url, instagram_handle, interested_categories, company_city')
      .eq('user_id', user.id)
      .single()

    if (!profileData) { setLoading(false); return }
    setProfile(profileData as BrandProfile)

    const { data: orderData } = await supabase
      .from('contracts')
      .select(`
        id, agreed_price_inr, status, hired_at,
        influencer_profiles ( id, display_name, profile_photo_url ),
        content_packages ( format, platform )
      `)
      .eq('brand_id', profileData.id)
      .order('hired_at', { ascending: false })

    setOrders((orderData || []) as unknown as Order[])

    const cats = profileData.interested_categories || []
    let creatorsQuery = supabase
      .from('influencer_profiles')
      .select('id, display_name, profile_photo_url, niche, city, reputation_score, social_accounts(follower_count)')
      .eq('is_profile_live', true)
      .order('reputation_score', { ascending: false })
      .limit(8)

    if (cats.length > 0) {
      creatorsQuery = creatorsQuery.overlaps('niche', cats)
    }

    const { data: creatorsData } = await creatorsQuery
    setRecommended((creatorsData || []) as unknown as Creator[])

    setLoading(false)
  }

  function dismissNudge() {
    setNudgeDismissed(true)
    try { localStorage.setItem('brand_nudge_dismissed', '1') } catch { /* ignore */ }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const brandName = profile?.company_name || 'Brand'
  const firstName = brandName.split(' ')[0]
  const completion = profile ? getProfileCompletion(profile) : null
  const showNudge = !nudgeDismissed && !!completion && completion.pct < 100

  const activeOrders = orders.filter(o => ['pending_acceptance', 'accepted', 'content_submitted', 'revision_requested'].includes(o.status))
  const toReview = orders.filter(o => o.status === 'content_submitted')
  const pendingAcceptance = orders.filter(o => o.status === 'pending_acceptance')
  const delivered = orders.filter(o => ['approved', 'auto_approved'].includes(o.status))
  const totalSpent = orders
    .filter(o => !['declined', 'cancelled'].includes(o.status))
    .reduce((s, o) => s + (o.agreed_price_inr || 0), 0)
  const recentOrders = orders.slice(0, 4)
  const isNewBrand = !loading && orders.length === 0

  return (
    <div className="min-h-screen bg-[#EDEFEB] flex">
      {/* SIDEBAR */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col fixed left-0 top-16 bottom-0 z-20">
        <div className="p-6 border-b border-[#E8E8E8]">
          <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] text-[16px] font-black mb-3 overflow-hidden">
            {profile?.logo_url
              ? <img src={profile.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              : brandName[0]?.toUpperCase() || 'B'
            }
          </div>
          <p className="text-[14px] font-bold text-[#121511] truncate">{brandName}</p>
          <p className="text-[12px] text-[#6A6C6A]">Brand</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-semibold transition-colors ${
                  active ? 'bg-[#9FE870] text-[#163300]' : 'text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-[#121511]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#E8E8E8]">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-semibold text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[240px] px-8 py-8">
        <div className="max-w-[960px]">

          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-[30px] font-black text-[#121511]">
              {isNewBrand ? `Welcome to Crayon, ${firstName}` : `Welcome back, ${firstName}`}
            </h1>
            <p className="text-[15px] text-[#6A6C6A] mt-1">
              {isNewBrand
                ? "You're all set. Here's how to make your first hire."
                : "Here's what's happening with your campaigns today."
              }
            </p>
          </div>

          {/* Profile completion nudge */}
          {showNudge && completion && (
            <div className="bg-white rounded-[24px] p-5 mb-6 border-2 border-[#9FE870]/40 relative">
              <button onClick={dismissNudge} className="absolute top-4 right-4 p-1 hover:opacity-60">
                <X className="w-4 h-4 text-[#6A6C6A]" />
              </button>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#EDEFEB" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke="#9FE870" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - completion.pct / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[#163300]">
                    {completion.pct}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-[#121511] mb-0.5">Complete your brand profile</p>
                  <p className="text-[13px] text-[#6A6C6A] mb-3">
                    Brands with complete profiles get <span className="font-bold text-[#163300]">3× more</span> creator applications.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {completion.missing.slice(0, 3).map(item => (
                      <span key={item} className="text-[12px] bg-[#EDEFEB] text-[#163300] font-semibold px-3 py-1 rounded-full">
                        + {item}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/brand/profile"
                    className="inline-flex items-center gap-1.5 bg-[#163300] text-[#9FE870] font-bold text-[13px] px-5 py-2.5 rounded-full hover:bg-[#1f4a00] transition-colors"
                  >
                    Complete Profile <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── STATE A: New brand ── */}
          {isNewBrand && (
            <>
              {/* How it works — 3 steps */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {
                    step: '1',
                    Icon: Search,
                    title: 'Find a creator',
                    desc: 'Browse profiles, check portfolios, and pick the right fit for your brand.',
                    href: '/brand/discover',
                    cta: 'Browse creators',
                  },
                  {
                    step: '2',
                    Icon: Package,
                    title: 'Send your brief',
                    desc: 'Share your product and goals. Pay securely — funds are held in escrow.',
                    href: '/brand/discover',
                    cta: 'Start here',
                  },
                  {
                    step: '3',
                    Icon: CheckCircle,
                    title: 'Approve & release',
                    desc: 'Review content you love. Funds are released to the creator on approval.',
                    href: null,
                    cta: null,
                  },
                ].map(({ step, Icon, title, desc, href, cta }) => (
                  <div key={step} className="bg-white rounded-[20px] p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#EDEFEB] flex items-center justify-center">
                      <span className="text-[11px] font-black text-[#6A6C6A]">{step}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#9FE870] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#163300]" />
                    </div>
                    <p className="text-[15px] font-black text-[#121511] mb-1">{title}</p>
                    <p className="text-[13px] text-[#6A6C6A] leading-relaxed mb-4">{desc}</p>
                    {href && cta && (
                      <Link href={href} className="text-[13px] font-bold text-[#163300] hover:text-[#9FE870] transition-colors">
                        {cta} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* Discover CTA banner */}
              <Link
                href="/brand/discover"
                className="flex items-center justify-between bg-[#163300] rounded-[24px] p-6 mb-8 group hover:bg-[#1f4a00] transition-colors"
              >
                <div>
                  <p className="text-[20px] font-black text-[#9FE870] mb-1">Find your first creator</p>
                  <p className="text-[14px] text-white/70">Browse 10,000+ verified influencers across India</p>
                </div>
                <div className="w-10 h-10 bg-[#9FE870] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-5 h-5 text-[#163300]" />
                </div>
              </Link>
            </>
          )}

          {/* ── STATE B: Active brand ── */}
          {!isNewBrand && (
            <>
              {/* Action items */}
              {(toReview.length > 0 || pendingAcceptance.length > 0) && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {toReview.length > 0 && (
                    <Link
                      href="/brand/orders"
                      className="bg-white border-2 border-[#9FE870] rounded-[20px] p-5 flex items-center gap-4 hover:bg-[#9FE870]/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#9FE870] flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-[#163300]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[22px] font-black text-[#163300] leading-none">{toReview.length}</p>
                        <p className="text-[13px] text-[#6A6C6A]">{toReview.length === 1 ? 'piece of content' : 'pieces of content'} to review</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#163300]" />
                    </Link>
                  )}
                  {pendingAcceptance.length > 0 && (
                    <Link
                      href="/brand/orders"
                      className="bg-white border border-[#E8E8E8] rounded-[20px] p-5 flex items-center gap-4 hover:bg-[#EDEFEB] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[22px] font-black text-[#121511] leading-none">{pendingAcceptance.length}</p>
                        <p className="text-[13px] text-[#6A6C6A]">awaiting creator acceptance</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#B0B2AF]" />
                    </Link>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Active hires', value: activeOrders.length, Icon: Users },
                  { label: 'Campaigns completed', value: delivered.length, Icon: TrendingUp },
                  { label: 'Total spent', value: totalSpent > 0 ? `₹${totalSpent.toLocaleString('en-IN')}` : '₹0', Icon: CheckCircle },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="bg-white rounded-[20px] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#163300]" />
                    </div>
                    <div>
                      <p className="text-[26px] font-black text-[#163300] leading-none">{value}</p>
                      <p className="text-[12px] text-[#6A6C6A] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-[24px] p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-black text-[#121511]">Recent orders</h2>
                  <Link href="/brand/orders" className="text-[13px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-[#E8E8E8]">
                  {recentOrders.map(order => {
                    const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending_acceptance
                    return (
                      <Link
                        key={order.id}
                        href={`/brand/orders/${order.id}`}
                        className="flex items-center gap-4 py-3 -mx-6 px-6 hover:bg-[#EDEFEB] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] text-[12px] font-black flex-shrink-0 overflow-hidden">
                          {order.influencer_profiles?.profile_photo_url
                            ? <img src={order.influencer_profiles.profile_photo_url} alt="" className="w-full h-full object-cover" />
                            : (order.influencer_profiles?.display_name?.[0] || '?').toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-[#121511] truncate">
                            {order.influencer_profiles?.display_name || '—'}
                          </p>
                          <p className="text-[12px] text-[#6A6C6A] capitalize">
                            {[order.content_packages?.format, `₹${order.agreed_price_inr.toLocaleString('en-IN')}`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                        <ChevronRight className="w-4 h-4 text-[#B0B2AF] flex-shrink-0" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Recommended creators (both states) */}
          {!loading && recommended.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-black text-[#121511]">
                  {isNewBrand ? 'Creators you might like' : 'Discover more creators'}
                </h2>
                <Link href="/brand/discover" className="text-[13px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors">
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {recommended.slice(0, 4).map(creator => (
                  <Link
                    key={creator.id}
                    href={`/brand/creators/${creator.id}`}
                    className="bg-white rounded-[20px] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-24 bg-[#EDEFEB] overflow-hidden">
                      {creator.profile_photo_url
                        ? <img src={creator.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        : (
                          <div className="w-full h-full bg-[#163300] flex items-center justify-center text-[#9FE870] text-[28px] font-black">
                            {creator.display_name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )
                      }
                    </div>
                    <div className="p-4">
                      <p className="text-[14px] font-bold text-[#121511] truncate">{creator.display_name}</p>
                      {creator.niche && creator.niche.length > 0 && (
                        <p className="text-[12px] text-[#6A6C6A] capitalize truncate mb-2">{creator.niche[0]}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-[#6A6C6A]">{fmtFollowers(creator.social_accounts?.[0]?.follower_count ?? null)}</span>
                        {creator.city && (
                          <span className="text-[11px] text-[#6A6C6A] truncate ml-2">{creator.city}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
