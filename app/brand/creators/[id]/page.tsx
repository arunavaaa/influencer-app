'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ArrowLeft, Check, X, ChevronDown, ChevronUp, ShieldCheck,
  MapPin, Users, TrendingUp, Eye, Star, Lock,
  BadgeCheck, Calendar, FileText, AlertCircle, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { PaymentModal } from '@/components/shared/PaymentModal'

/* ─── Types ─────────────────────────────────────────────── */
type Package = {
  id: string
  format: string
  platform: string
  price_inr: number
  delivery_days: number
  revisions_allowed: number
  description: string | null
}

type SocialAccount = {
  platform: string
  handle_masked: string
  follower_count: number | null
  engagement_rate: number | null
}

type Creator = {
  id: string
  display_name: string
  profile_title: string | null
  bio: string | null
  niche: string[]
  city: string | null
  language: string[]
  profile_photo_url: string | null
  portfolio_urls: string[]
  reputation_score: number
  ig_verified: boolean
  audience_india_pct: number | null
  audience_gender_male_pct: number | null
  audience_age_18_24_pct: number | null
  audience_age_25_34_pct: number | null
  audience_age_35_44_pct: number | null
  faq: { q: string; a: string }[]
}

type SimilarCreator = {
  id: string
  display_name: string
  profile_photo_url: string | null
  niche: string[]
  city: string | null
  min_price: number
}

/* ─── Helpers ────────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
]

function fmtFollowers(n: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

function fmtPrice(p: number) {
  return `₹${p.toLocaleString('en-IN')}`
}

function platformIcon(platform: string) {
  if (platform === 'instagram') return '📸'
  if (platform === 'youtube') return '▶️'
  return '📱'
}

/* ─── How It Works Modal ─────────────────────────────────── */
function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[24px] p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDEFEB] transition-colors"
        >
          <X className="w-4 h-4 text-[#6A6C6A]" />
        </button>

        <h2 className="text-[20px] font-black text-[#121511] mb-6">
          How does it work?
        </h2>

        <div className="flex flex-col gap-6">
          {[
            {
              icon: <ShieldCheck className="w-6 h-6 text-[#163300]" />,
              title: 'Pay into escrow',
              desc: "Your payment is held safely. If the creator declines or doesn't respond in 48h, you get a full refund automatically.",
            },
            {
              icon: <FileText className="w-6 h-6 text-[#163300]" />,
              title: 'Creator makes your content',
              desc: "The creator receives your brief and creates content. You'll be notified when it's ready to review.",
            },
            {
              icon: <Check className="w-6 h-6 text-[#163300]" />,
              title: 'Approve & release payment',
              desc: 'Review the content, request a revision if needed, or approve. Payment releases to the creator only after you approve.',
            },
          ].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#9FE870]/20 flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#121511]">{step.title}</p>
                <p className="text-[14px] text-[#6A6C6A] mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-[#EDEFEB] rounded-[12px] flex items-start gap-2">
          <Lock className="w-4 h-4 text-[#163300] mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-[#6A6C6A]">
            Payment protection: if an order is declined, funds are refunded in full.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Hire Modal ─────────────────────────────────────────── */
type HireModalProps = {
  creator: Creator
  pkg: Package
  brandId: string
  onClose: () => void
  onSuccess: (contractId: string) => void
}

function HireModal({ creator, pkg, brandId, onClose, onSuccess }: HireModalProps) {
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [brief, setBrief] = useState({ product: '', message: '', dosDonts: '', goliveDate: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const platformFee = Math.round(pkg.price_inr * 0.10)
  const total = pkg.price_inr + platformFee

  function validate() {
    const e: Record<string, string> = {}
    if (!brief.product.trim()) e.product = 'Required'
    if (!brief.message.trim()) e.message = 'Required'
    if (!brief.goliveDate) e.goliveDate = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          brand_id: brandId,
          influencer_id: creator.id,
          package_id: pkg.id,
          agreed_price_inr: pkg.price_inr,
          status: 'pending_acceptance',
          escrow_status: 'pending_payment',
          brief_product: brief.product.trim(),
          brief_message: brief.message.trim(),
          brief_dos_donts: brief.dosDonts.trim() || null,
          brief_golive_date: brief.goliveDate,
          hired_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) throw error
      onSuccess(data.id)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E8E8] flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#6A6C6A] uppercase tracking-wider">
              {step === 1 ? 'Step 1 of 2 — Brief' : 'Step 2 of 2 — Review & Confirm'}
            </p>
            <h2 className="text-[18px] font-black text-[#121511] mt-0.5">
              Hire {creator.display_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDEFEB] transition-colors"
          >
            <X className="w-4 h-4 text-[#6A6C6A]" />
          </button>
        </div>

        {/* Package summary pill */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3 p-3 bg-[#EDEFEB] rounded-[12px]">
            <span className="text-[18px]">{platformIcon(pkg.platform)}</span>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#121511]">{pkg.format}</p>
              <p className="text-[12px] text-[#6A6C6A]">
                {pkg.delivery_days} day delivery · {pkg.revisions_allowed} revision{pkg.revisions_allowed !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-[16px] font-black text-[#163300]">{fmtPrice(pkg.price_inr)}</p>
          </div>
        </div>

        {step === 1 ? (
          <div className="p-6 flex flex-col gap-5">
            {/* Product */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#163300] mb-1.5">
                What is your product or service? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Nykaa lip gloss collection, Boat wireless earbuds"
                value={brief.product}
                onChange={e => setBrief(b => ({ ...b, product: e.target.value }))}
                className={`w-full px-4 py-3 rounded-[12px] border text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors ${errors.product ? 'border-red-400 bg-red-50' : 'border-[#E8E8E8]'}`}
              />
              {errors.product && <p className="text-[12px] text-red-500 mt-1">{errors.product}</p>}
            </div>

            {/* Key message */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#163300] mb-1.5">
                Key message or angle <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Focus on how the product helps with everyday skincare. Show it in a morning routine."
                value={brief.message}
                onChange={e => setBrief(b => ({ ...b, message: e.target.value }))}
                className={`w-full px-4 py-3 rounded-[12px] border text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-[#E8E8E8]'}`}
              />
              {errors.message && <p className="text-[12px] text-red-500 mt-1">{errors.message}</p>}
            </div>

            {/* Dos & Donts */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#163300] mb-1.5">
                Dos & don'ts <span className="text-[#B0B2AF] font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Do mention the discount code SAVE20. Don't show competitor products."
                value={brief.dosDonts}
                onChange={e => setBrief(b => ({ ...b, dosDonts: e.target.value }))}
                className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors resize-none"
              />
            </div>

            {/* Go-live date */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[#163300] mb-1.5">
                Preferred go-live date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={new Date(Date.now() + pkg.delivery_days * 86_400_000).toISOString().split('T')[0]}
                value={brief.goliveDate}
                onChange={e => setBrief(b => ({ ...b, goliveDate: e.target.value }))}
                className={`w-full px-4 py-3 rounded-[12px] border text-[15px] text-[#121511] focus:outline-none focus:border-[#163300] transition-colors ${errors.goliveDate ? 'border-red-400 bg-red-50' : 'border-[#E8E8E8]'}`}
              />
              {errors.goliveDate && <p className="text-[12px] text-red-500 mt-1">{errors.goliveDate}</p>}
              <p className="text-[12px] text-[#6A6C6A] mt-1">
                Creator needs {pkg.delivery_days} day{pkg.delivery_days !== 1 ? 's' : ''} to deliver — earliest possible date is pre-selected.
              </p>
            </div>

            <button
              onClick={() => { if (validate()) setStep(2) }}
              className="w-full py-4 rounded-[14px] bg-[#163300] text-white text-[16px] font-bold hover:bg-[#1e4a00] transition-colors mt-2"
            >
              Review order →
            </button>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5">
            {/* Brief recap */}
            <div className="p-4 bg-[#EDEFEB] rounded-[14px] flex flex-col gap-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#6A6C6A]">Your brief</p>
              <div>
                <p className="text-[12px] text-[#6A6C6A]">Product / Service</p>
                <p className="text-[14px] font-semibold text-[#121511] mt-0.5">{brief.product}</p>
              </div>
              <div>
                <p className="text-[12px] text-[#6A6C6A]">Key message</p>
                <p className="text-[14px] font-semibold text-[#121511] mt-0.5">{brief.message}</p>
              </div>
              {brief.dosDonts && (
                <div>
                  <p className="text-[12px] text-[#6A6C6A]">Dos & don'ts</p>
                  <p className="text-[14px] font-semibold text-[#121511] mt-0.5">{brief.dosDonts}</p>
                </div>
              )}
              <div>
                <p className="text-[12px] text-[#6A6C6A]">Preferred go-live</p>
                <p className="text-[14px] font-semibold text-[#121511] mt-0.5">
                  {new Date(brief.goliveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="border border-[#E8E8E8] rounded-[14px] overflow-hidden">
              <div className="px-4 py-3 flex justify-between items-center border-b border-[#E8E8E8]">
                <span className="text-[14px] text-[#6A6C6A]">{pkg.format} package</span>
                <span className="text-[14px] font-semibold text-[#121511]">{fmtPrice(pkg.price_inr)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center border-b border-[#E8E8E8]">
                <span className="text-[14px] text-[#6A6C6A]">Platform fee (10%)</span>
                <span className="text-[14px] font-semibold text-[#121511]">{fmtPrice(platformFee)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center bg-[#EDEFEB]">
                <span className="text-[15px] font-bold text-[#121511]">Total</span>
                <span className="text-[18px] font-black text-[#163300]">{fmtPrice(total)}</span>
              </div>
            </div>

            {/* Escrow guarantee */}
            <div className="flex items-start gap-3 p-3 bg-[#9FE870]/15 border border-[#9FE870] rounded-[12px]">
              <ShieldCheck className="w-5 h-5 text-[#163300] mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-[#163300]">
                <strong>Escrow protected.</strong> Your payment is held safely. If the creator declines or doesn't respond in 48h, you get a full automatic refund.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-[14px] border border-[#E8E8E8] text-[15px] font-semibold text-[#6A6C6A] hover:bg-[#EDEFEB] transition-colors"
              >
                ← Edit brief
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-4 rounded-[14px] bg-[#9FE870] text-[#163300] text-[16px] font-black hover:bg-[#8fd960] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'Saving brief…' : 'Confirm brief & pay →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [creator, setCreator] = useState<Creator | null>(null)
  const [social, setSocial] = useState<SocialAccount | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [similar, setSimilar] = useState<SimilarCreator[]>([])
  const [brandId, setBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [platformTab, setPlatformTab] = useState('All')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showHireModal, setShowHireModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<{
    contractId: string
    agreedPriceInr: number
    creatorName: string
    packageFormat: string
  } | null>(null)

  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [{ data: brand }, { data: profile }, { data: socialData }, { data: pkgs }] = await Promise.all([
      supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle(),
      supabase.from('influencer_profiles').select('*').eq('id', id).single(),
      supabase.from('social_accounts').select('platform, handle_masked, follower_count, engagement_rate').eq('influencer_id', id).eq('platform', 'instagram').maybeSingle(),
      supabase.from('content_packages').select('*').eq('influencer_id', id).eq('is_active', true).order('price_inr'),
    ])

    if (!profile) { router.push('/brand/discover'); return }

    setBrandId(brand?.id || null)
    setCreator(profile as Creator)
    setSocial(socialData)
    setPackages(pkgs || [])
    if (pkgs && pkgs.length > 0) setSelectedPkg(pkgs[0])

    // Similar creators — same niche, exclude current
    if (profile.niche?.length) {
      const { data: sim } = await supabase
        .from('influencer_profiles')
        .select('id, display_name, profile_photo_url, niche, city')
        .eq('is_profile_live', true)
        .overlaps('niche', profile.niche)
        .neq('id', id)
        .limit(4)

      // Get min prices for similar creators
      if (sim && sim.length > 0) {
        const ids = sim.map((s: { id: string }) => s.id)
        const { data: simPkgs } = await supabase
          .from('content_packages')
          .select('influencer_id, price_inr')
          .in('influencer_id', ids)
          .eq('is_active', true)
          .order('price_inr')

        const minPriceMap: Record<string, number> = {}
        for (const p of simPkgs || []) {
          if (!minPriceMap[p.influencer_id]) minPriceMap[p.influencer_id] = p.price_inr
        }
        setSimilar(sim.map((s: { id: string; display_name: string; profile_photo_url: string | null; niche: string[]; city: string | null }) => ({ ...s, min_price: minPriceMap[s.id] || 0 })))
      }
    }

    setLoading(false)
  }

  const filteredPackages = platformTab === 'All'
    ? packages
    : packages.filter(p => p.platform.toLowerCase() === platformTab.toLowerCase())

  const platforms = ['All', ...Array.from(new Set(packages.map(p => p.platform)))]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#163300]" />
      </div>
    )
  }

  if (!creator) return null

  const colorIdx = creator.display_name.charCodeAt(0) % AVATAR_COLORS.length
  const avatarColor = AVATAR_COLORS[colorIdx]
  const avgViews = social?.follower_count ? Math.round(social.follower_count * ((social.engagement_rate || 3) / 100) * 4) : null
  const indiaPct = creator.audience_india_pct

  return (
    <>
      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
      {showHireModal && selectedPkg && brandId && (
        <HireModal
          creator={creator}
          pkg={selectedPkg}
          brandId={brandId}
          onClose={() => setShowHireModal(false)}
          onSuccess={(contractId) => {
            setShowHireModal(false)
            setPaymentInfo({
              contractId,
              agreedPriceInr: selectedPkg.price_inr,
              creatorName: creator.display_name,
              packageFormat: selectedPkg.format,
            })
          }}
        />
      )}

      {paymentInfo && (
        <PaymentModal
          contractId={paymentInfo.contractId}
          agreedPriceInr={paymentInfo.agreedPriceInr}
          creatorName={paymentInfo.creatorName}
          packageFormat={paymentInfo.packageFormat}
          onSuccess={() => router.push(`/brand/orders/${paymentInfo.contractId}`)}
          onClose={() => {
            setPaymentInfo(null)
            router.push('/brand/orders')
          }}
        />
      )}

      <div className="min-h-screen bg-[#EDEFEB]">
        {/* Back nav */}
        <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[14px] font-semibold text-[#6A6C6A] hover:text-[#121511] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </button>
        </div>

        <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">

          {/* ── PORTFOLIO GRID HEADER ── */}
          {(() => {
            const urls = creator.portfolio_urls?.length ? creator.portfolio_urls : creator.profile_photo_url ? [creator.profile_photo_url] : []
            const isVideo = (url: string) => /\.(mp4|mov|webm)$/i.test(url)
            const preview = urls.slice(0, 3)
            const cols = preview.length === 1 ? 'grid-cols-1' : preview.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            return (
              <div className={`relative rounded-[20px] overflow-hidden mb-0 h-[380px] grid gap-0.5 ${cols}`}>
                {preview.length > 0 ? preview.map((url, i) => (
                  <div key={i} className="relative overflow-hidden bg-[#163300]">
                    {isVideo(url) ? (
                      <>
                        <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-t-transparent border-b-transparent border-l-[#163300] ml-1" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                )) : (
                  <div className="col-span-3 flex items-center justify-center bg-gradient-to-br from-[#163300] to-[#2a5a00]">
                    <p className="text-[100px] font-black text-[#9FE870]/15 select-none">{creator.display_name[0]}</p>
                  </div>
                )}
                {urls.length > 3 && (
                  <button className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[12px] font-bold text-[#121511] hover:bg-white transition-colors shadow-sm">
                    <span className="text-[14px]">⊞</span> Show all {urls.length} photos
                  </button>
                )}
              </div>
            )
          })()}

          {/* ── TWO-COLUMN LAYOUT ── */}
          <div className="flex gap-8 items-start">
            {/* LEFT COLUMN */}
            <div className="flex-1 min-w-0">
              {/* Profile header — avatar overlaps grid */}
              <div className="flex items-end gap-4 -mt-8 mb-5 px-1">
                <div className={`w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-[28px] font-black overflow-hidden border-4 border-white shadow-md ${avatarColor.bg} ${avatarColor.text}`}>
                  {creator.profile_photo_url
                    ? <img src={creator.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    : creator.display_name[0].toUpperCase()
                  }
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-[24px] font-black text-[#121511]">{creator.display_name}</h1>
                    {creator.ig_verified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#9FE870]/20 border border-[#9FE870] rounded-full text-[11px] font-bold text-[#163300]">
                        <BadgeCheck className="w-3 h-3" />
                        Verified by Crayon
                      </span>
                    )}
                  </div>
                  {creator.profile_title && (
                    <p className="text-[14px] text-[#6A6C6A] mt-0.5">{creator.profile_title}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {creator.city && (
                      <span className="flex items-center gap-1 text-[13px] text-[#6A6C6A]">
                        <MapPin className="w-3.5 h-3.5" /> {creator.city}
                      </span>
                    )}
                    {creator.language.length > 0 && (
                      <span className="text-[13px] text-[#6A6C6A]">{creator.language.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                  {creator.niche.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {creator.niche.map(n => (
                        <span key={n} className="px-2.5 py-0.5 rounded-full bg-[#EDEFEB] text-[12px] font-semibold text-[#163300]">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-[16px] p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-[#163300]" />
                    {creator.ig_verified && <BadgeCheck className="w-3 h-3 text-[#9FE870]" />}
                  </div>
                  <p className="text-[22px] font-black text-[#121511]">{fmtFollowers(social?.follower_count || null)}</p>
                  <p className="text-[11px] text-[#6A6C6A] mt-0.5">Followers</p>
                </div>
                <div className="bg-white rounded-[16px] p-4 text-center">
                  <TrendingUp className="w-4 h-4 text-[#163300] mx-auto mb-1" />
                  <p className="text-[22px] font-black text-[#121511]">
                    {social?.engagement_rate ? `${social.engagement_rate}%` : '—'}
                  </p>
                  <p className="text-[11px] text-[#6A6C6A] mt-0.5">Engagement</p>
                </div>
                <div className={`rounded-[16px] p-4 text-center ${indiaPct && indiaPct >= 60 ? 'bg-[#9FE870] border-2 border-[#163300]' : 'bg-white'}`}>
                  <p className="text-[18px] mb-1">🇮🇳</p>
                  <p className={`text-[22px] font-black ${indiaPct && indiaPct >= 60 ? 'text-[#163300]' : 'text-[#121511]'}`}>
                    {indiaPct ? `${indiaPct}%` : '—'}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${indiaPct && indiaPct >= 60 ? 'text-[#163300] font-bold' : 'text-[#6A6C6A]'}`}>
                    Indian audience
                  </p>
                </div>
              </div>

              {/* Bio */}
              {creator.bio && (
                <div className="bg-white rounded-[20px] p-5 mb-6">
                  <p className="text-[15px] text-[#121511] leading-relaxed">{creator.bio}</p>
                </div>
              )}

              {/* ── PACKAGES ── */}
              <div className="bg-white rounded-[20px] p-6 mb-6">
                <h2 className="text-[18px] font-black text-[#121511] mb-4">Packages</h2>

                {/* Platform tabs */}
                {platforms.length > 2 && (
                  <div className="flex gap-1 mb-4 border-b border-[#E8E8E8] pb-1">
                    {platforms.map(p => (
                      <button
                        key={p}
                        onClick={() => setPlatformTab(p)}
                        className={`px-4 py-2 text-[14px] font-semibold capitalize transition-colors rounded-t-[8px] ${platformTab === p ? 'text-[#163300] border-b-2 border-[#163300]' : 'text-[#6A6C6A] hover:text-[#121511]'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {filteredPackages.map(pkg => (
                    <label
                      key={pkg.id}
                      className={`flex items-center gap-4 p-4 rounded-[14px] cursor-pointer border transition-all ${selectedPkg?.id === pkg.id ? 'border-[#163300] bg-[#EDEFEB]' : 'border-[#E8E8E8] hover:border-[#163300]/30'}`}
                    >
                      <input
                        type="radio"
                        name="package"
                        checked={selectedPkg?.id === pkg.id}
                        onChange={() => setSelectedPkg(pkg)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedPkg?.id === pkg.id ? 'border-[#163300] bg-[#163300]' : 'border-[#B0B2AF]'}`}>
                        {selectedPkg?.id === pkg.id && <div className="w-2 h-2 rounded-full bg-[#9FE870]" />}
                      </div>
                      <span className="text-[18px] flex-shrink-0">{platformIcon(pkg.platform)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-[#121511]">{pkg.format}</p>
                        <p className="text-[12px] text-[#6A6C6A] mt-0.5">
                          {pkg.delivery_days}d delivery · {pkg.revisions_allowed} revision{pkg.revisions_allowed !== 1 ? 's' : ''}
                          {pkg.description ? ` · ${pkg.description}` : ''}
                        </p>
                      </div>
                      <p className="text-[16px] font-black text-[#163300] flex-shrink-0">{fmtPrice(pkg.price_inr)}</p>
                    </label>
                  ))}
                </div>

                {filteredPackages.length === 0 && (
                  <p className="text-[14px] text-[#6A6C6A] text-center py-6">No packages available for this platform.</p>
                )}
              </div>

              {/* ── ANALYTICS ── */}
              {(social?.follower_count || creator.audience_india_pct) && (
                <div className="bg-white rounded-[20px] p-6 mb-6">
                  <h2 className="text-[18px] font-black text-[#121511] mb-4">Analytics</h2>

                  {!creator.ig_verified && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-[10px]">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-[12px] text-yellow-700">Self-reported by creator. Verification via Instagram coming soon.</p>
                    </div>
                  )}

                  {/* Core stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Followers', value: fmtFollowers(social?.follower_count || null), icon: <Users className="w-4 h-4" /> },
                      { label: 'Avg Views', value: fmtFollowers(avgViews), icon: <Eye className="w-4 h-4" /> },
                      { label: 'Engagement', value: social?.engagement_rate ? `${social.engagement_rate}%` : '—', icon: <TrendingUp className="w-4 h-4" /> },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="text-[24px] font-black text-[#121511]">{s.value}</p>
                        <p className="text-[12px] text-[#6A6C6A] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Audience location */}
                  {creator.audience_india_pct && (
                    <div className="mb-5">
                      <p className="text-[13px] font-bold text-[#121511] mb-3">Audience Location</p>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[13px] w-24 flex-shrink-0">🇮🇳 India</span>
                        <div className="flex-1 h-2 rounded-full bg-[#EDEFEB] overflow-hidden">
                          <div className="h-full bg-[#163300] rounded-full" style={{ width: `${creator.audience_india_pct}%` }} />
                        </div>
                        <span className="text-[13px] font-bold text-[#163300] w-8 text-right">{creator.audience_india_pct}%</span>
                      </div>
                      {creator.audience_india_pct < 100 && (
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] w-24 flex-shrink-0">🌍 Other</span>
                          <div className="flex-1 h-2 rounded-full bg-[#EDEFEB] overflow-hidden">
                            <div className="h-full bg-[#B0B2AF] rounded-full" style={{ width: `${100 - creator.audience_india_pct}%` }} />
                          </div>
                          <span className="text-[13px] font-bold text-[#6A6C6A] w-8 text-right">{100 - creator.audience_india_pct}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Age distribution */}
                  {(creator.audience_age_18_24_pct || creator.audience_age_25_34_pct || creator.audience_age_35_44_pct) && (
                    <div className="mb-5">
                      <p className="text-[13px] font-bold text-[#121511] mb-3">Audience Age</p>
                      <div className="flex items-end gap-2 h-16">
                        {[
                          { label: '13–17', pct: 100 - (creator.audience_age_18_24_pct || 0) - (creator.audience_age_25_34_pct || 0) - (creator.audience_age_35_44_pct || 0) > 0 ? Math.max(0, 100 - (creator.audience_age_18_24_pct || 0) - (creator.audience_age_25_34_pct || 0) - (creator.audience_age_35_44_pct || 0) - 10) : 2 },
                          { label: '18–24', pct: creator.audience_age_18_24_pct || 0 },
                          { label: '25–34', pct: creator.audience_age_25_34_pct || 0 },
                          { label: '35–44', pct: creator.audience_age_35_44_pct || 0 },
                          { label: '45+', pct: 5 },
                        ].map(a => (
                          <div key={a.label} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-[#6A6C6A]">{a.pct}%</span>
                            <div className="w-full rounded-t-[4px] bg-[#163300]/20" style={{ height: `${Math.max(4, a.pct * 0.6)}px` }}>
                              <div className="w-full h-full rounded-t-[4px] bg-[#163300]" />
                            </div>
                            <span className="text-[10px] text-[#6A6C6A]">{a.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {creator.audience_gender_male_pct && (
                    <div>
                      <p className="text-[13px] font-bold text-[#121511] mb-3">Audience Gender</p>
                      <div className="flex rounded-full overflow-hidden h-4">
                        <div className="bg-[#163300]" style={{ width: `${creator.audience_gender_male_pct}%` }} />
                        <div className="bg-[#9FE870]" style={{ width: `${100 - creator.audience_gender_male_pct}%` }} />
                      </div>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-[12px] text-[#6A6C6A]">
                          <span className="w-3 h-3 rounded-sm bg-[#163300] inline-block" />
                          Male {creator.audience_gender_male_pct}%
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-[#6A6C6A]">
                          <span className="w-3 h-3 rounded-sm bg-[#9FE870] inline-block" />
                          Female {100 - creator.audience_gender_male_pct}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── PORTFOLIO ── */}
              {creator.portfolio_urls && creator.portfolio_urls.length > 0 && (
                <div className="bg-white rounded-[20px] p-6 mb-6">
                  <h2 className="text-[18px] font-black text-[#121511] mb-4">Portfolio</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {creator.portfolio_urls.map((url, i) => {
                      const isVid = /\.(mp4|mov|webm)$/i.test(url)
                      return (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative rounded-[12px] overflow-hidden bg-[#EDEFEB] aspect-square group">
                          {isVid ? (
                            <>
                              <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                  <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[12px] border-t-transparent border-b-transparent border-l-[#163300] ml-1" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── FAQ ── */}
              {creator.faq && creator.faq.length > 0 && (
                <div className="bg-white rounded-[20px] p-6 mb-6">
                  <h2 className="text-[18px] font-black text-[#121511] mb-4">FAQ</h2>
                  <div className="flex flex-col divide-y divide-[#E8E8E8]">
                    {creator.faq.map((item, i) => (
                      <div key={i} className="py-4">
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <span className="text-[15px] font-semibold text-[#121511] pr-4">{item.q}</span>
                          {openFaq === i
                            ? <ChevronUp className="w-4 h-4 text-[#6A6C6A] flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-[#6A6C6A] flex-shrink-0" />}
                        </button>
                        {openFaq === i && (
                          <p className="text-[14px] text-[#6A6C6A] mt-2 leading-relaxed">{item.a}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SIMILAR CREATORS ── */}
              {similar.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-[18px] font-black text-[#121511] mb-4">
                    Creators similar to {creator.display_name.split(' ')[0]}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {similar.map((s, i) => {
                      const c = AVATAR_COLORS[s.display_name.charCodeAt(0) % AVATAR_COLORS.length]
                      return (
                        <Link
                          key={s.id}
                          href={`/brand/creators/${s.id}`}
                          className="bg-white rounded-[16px] overflow-hidden hover:shadow-md transition-shadow group"
                        >
                          <div className={`h-24 flex items-center justify-center text-[32px] font-black ${c.bg} ${c.text}`}>
                            {s.profile_photo_url
                              ? <img src={s.profile_photo_url} alt="" className="w-full h-full object-cover" />
                              : s.display_name[0].toUpperCase()
                            }
                          </div>
                          <div className="p-3">
                            <p className="text-[13px] font-bold text-[#121511] truncate group-hover:text-[#163300]">{s.display_name}</p>
                            <p className="text-[11px] text-[#6A6C6A] truncate">{s.niche.slice(0, 2).join(', ')}</p>
                            {s.min_price > 0 && (
                              <p className="text-[12px] font-semibold text-[#163300] mt-1">from {fmtPrice(s.min_price)}</p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — STICKY SIDEBAR */}
            <div className="w-[300px] flex-shrink-0">
              <div ref={sidebarRef} className="sticky top-6">
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E8E8E8]">
                  {selectedPkg ? (
                    <>
                      <p className="text-[28px] font-black text-[#163300]">{fmtPrice(selectedPkg.price_inr)}</p>
                      <div className="flex items-center gap-2 mt-1 mb-4">
                        <span className="text-[14px]">{platformIcon(selectedPkg.platform)}</span>
                        <span className="text-[14px] text-[#6A6C6A]">{selectedPkg.format}</span>
                      </div>

                      <div className="flex flex-col gap-2 mb-5 text-[13px] text-[#6A6C6A]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#163300]" />
                          <span>{selectedPkg.delivery_days} day delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#163300]" />
                          <span>{selectedPkg.revisions_allowed} free revision{selectedPkg.revisions_allowed !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#163300]" />
                          <span>Escrow-protected</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!brandId) { toast.error('Complete your brand profile first.'); return }
                          setShowHireModal(true)
                        }}
                        className="w-full py-4 rounded-[14px] bg-[#9FE870] text-[#163300] text-[16px] font-black hover:bg-[#8fd960] transition-colors"
                      >
                        Hire {creator.display_name.split(' ')[0]}
                      </button>

                      <div className="text-center mt-3">
                        <button
                          onClick={() => setShowHowItWorks(true)}
                          className="text-[13px] text-[#6A6C6A] hover:text-[#163300] transition-colors underline underline-offset-2"
                        >
                          How does it work?
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-[14px] text-[#6A6C6A] text-center py-4">Select a package to hire</p>
                  )}
                </div>

                {/* Free tier messaging note */}
                <div className="mt-3 p-4 bg-white rounded-[16px] border border-[#E8E8E8]">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-[#6A6C6A] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#121511]">Want to chat first?</p>
                      <p className="text-[12px] text-[#6A6C6A] mt-0.5">Messaging before hire is available on Pro.</p>
                      <Link href="/pricing" className="text-[12px] text-[#163300] font-bold hover:underline">
                        Upgrade to Pro →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
