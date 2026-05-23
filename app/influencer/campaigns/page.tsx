'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, IndianRupee, Calendar, Search, ChevronDown } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

const NICHES = ['Fashion', 'Beauty & Skincare', 'Food & Drink', 'Fitness & Wellness', 'Tech & Gadgets', 'Finance', 'Travel', 'Parenting', 'Comedy', 'Education', 'Music', 'Automotive', 'Lifestyle']
const FORMATS = ['reel', 'post', 'story', 'ugc']
const BUDGET_RANGES = [
  { label: 'Any budget', min: 0, max: Infinity },
  { label: 'Under ₹10K', min: 0, max: 10000 },
  { label: '₹10K–₹50K', min: 10000, max: 50000 },
  { label: '₹50K–₹2L', min: 50000, max: 200000 },
  { label: '₹2L+', min: 200000, max: Infinity },
]

type CampaignCard = {
  id: string
  title: string
  description: string | null
  budget_inr: number | null
  deadline: string | null
  target_niche: string[] | null
  required_format: string[] | null
  brand_profiles: {
    company_name: string | null
  } | null
}

const applySchema = z.object({
  cover_note: z
    .string()
    .trim()
    .min(20, 'Cover note must be at least 20 characters')
    .max(1000, 'Cover note must be 1000 characters or fewer'),
  proposed_price_inr: z
    .number({ message: 'Enter your proposed price' })
    .int('Price must be a whole number')
    .positive('Price must be greater than zero')
    .max(10000000, 'Price seems too large'),
})

type ApplyValues = z.infer<typeof applySchema>

function formatINR(n: number | null) {
  if (n == null) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export default function InfluencerCampaignsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [influencerId, setInfluencerId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([])
  const [applicationByCampaign, setApplicationByCampaign] = useState<
    Map<string, { status: string; contractId: string | null; applicationId: string | null }>
  >(new Map())
  const [loading, setLoading] = useState(true)
  const [applyingTo, setApplyingTo] = useState<CampaignCard | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  // Filters
  const [search, setSearch] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [selectedBudget, setSelectedBudget] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { cover_note: '', proposed_price_inr: undefined as unknown as number },
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profile, error: profileError } = await supabase
          .from('influencer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) { router.push('/onboarding/creator'); return }
        if (cancelled) return
        setInfluencerId(profile.id)

        const [campaignsRes, applicationsRes] = await Promise.all([
          supabase
            .from('campaigns')
            .select('id, title, description, budget_inr, deadline, target_niche, required_format, brand_profiles(company_name)')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .returns<CampaignCard[]>(),
          supabase
            .from('applications')
            .select('id, campaign_id, status, contracts(id)')
            .eq('influencer_id', profile.id)
            .returns<{ id: string; campaign_id: string; status: string; contracts: { id: string }[] | null }[]>(),
        ])

        if (cancelled) return

        if (campaignsRes.error) {
          toast.error('Could not load campaigns.')
        } else {
          setCampaigns(campaignsRes.data ?? [])
        }

        if (!applicationsRes.error) {
          const map = new Map<string, { status: string; contractId: string | null; applicationId: string | null }>()
          for (const a of applicationsRes.data ?? []) {
            map.set(a.campaign_id, { status: a.status, contractId: a.contracts?.[0]?.id ?? null, applicationId: a.id })
          }
          setApplicationByCampaign(map)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openApply(campaign: CampaignCard) {
    reset({ cover_note: '', proposed_price_inr: undefined as unknown as number })
    setApplyingTo(campaign)
  }

  async function onSubmitApply(values: ApplyValues) {
    if (!applyingTo || !influencerId) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('applications').insert({
        campaign_id: applyingTo.id,
        influencer_id: influencerId,
        status: 'pending',
        proposed_price_inr: values.proposed_price_inr,
        cover_note: values.cover_note,
      })

      if (error) {
        if (error.code === '23505') {
          toast.warning('You have already applied to this campaign.')
          setApplicationByCampaign(prev => {
            const next = new Map(prev)
            next.set(applyingTo.id, { status: 'pending', contractId: null, applicationId: null })
            return next
          })
          setApplyingTo(null)
          return
        }
        toast.error(error.message || 'Could not submit application.')
        return
      }

      setApplicationByCampaign(prev => {
        const next = new Map(prev)
        next.set(applyingTo.id, { status: 'pending', contractId: null, applicationId: null })
        return next
      })
      toast.success('Application submitted — the brand will see it.')
      setApplyingTo(null)
    } finally {
      setSubmitting(false)
    }
  }

  async function withdrawApplication(campaignId: string) {
    const app = applicationByCampaign.get(campaignId)
    if (!app?.applicationId) return
    setWithdrawingId(campaignId)
    const { error } = await supabase.from('applications').delete().eq('id', app.applicationId)
    setWithdrawingId(null)
    if (error) { toast.error('Could not withdraw application'); return }
    setApplicationByCampaign(prev => {
      const next = new Map(prev)
      next.delete(campaignId)
      return next
    })
    toast.success('Application withdrawn')
  }

  const budgetRange = BUDGET_RANGES[selectedBudget]
  const visibleCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !(c.brand_profiles?.company_name || '').toLowerCase().includes(search.toLowerCase())) return false
      if (selectedNiche && !(c.target_niche ?? []).includes(selectedNiche)) return false
      if (selectedFormat && !(c.required_format ?? []).includes(selectedFormat)) return false
      if (selectedBudget > 0) {
        const b = c.budget_inr ?? 0
        if (b < budgetRange.min || b > budgetRange.max) return false
      }
      return true
    })
  }, [campaigns, search, selectedNiche, selectedFormat, selectedBudget, budgetRange])

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      <div className="px-8 py-8">
        <div className="max-w-[960px]">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[30px] font-black text-[#121511]">Open Campaigns</h1>
            <p className="text-[15px] text-[#6A6C6A] mt-1">Browse briefs from brands and apply to ones that match your profile.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B2AF]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search campaigns…"
                className="w-full pl-9 pr-4 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300]"
              />
            </div>
            {/* Niche */}
            <div className="relative">
              <select
                value={selectedNiche}
                onChange={e => setSelectedNiche(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white text-[14px] text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer"
              >
                <option value="">All niches</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B2AF] pointer-events-none" />
            </div>
            {/* Format */}
            <div className="relative">
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white text-[14px] text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer"
              >
                <option value="">All formats</option>
                {FORMATS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B2AF] pointer-events-none" />
            </div>
            {/* Budget */}
            <div className="relative">
              <select
                value={selectedBudget}
                onChange={e => setSelectedBudget(Number(e.target.value))}
                className="appearance-none pl-4 pr-8 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white text-[14px] text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer"
              >
                {BUDGET_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B2AF] pointer-events-none" />
            </div>
            {/* Clear filters */}
            {(search || selectedNiche || selectedFormat || selectedBudget > 0) && (
              <button onClick={() => { setSearch(''); setSelectedNiche(''); setSelectedFormat(''); setSelectedBudget(0) }} className="px-4 py-2.5 rounded-[12px] bg-[#EDEFEB] text-[#6A6C6A] text-[13px] font-semibold hover:bg-[#E8E8E8] transition-colors">
                Clear
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-[#163300] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleCampaigns.length === 0 ? (
            <div className="bg-white rounded-[24px] p-12 text-center">
              <p className="text-[18px] font-black text-[#121511] mb-2">No open campaigns right now</p>
              <p className="text-[14px] text-[#6A6C6A]">Check back soon — new briefs are posted regularly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleCampaigns.map(c => {
                const application = applicationByCampaign.get(c.id)
                return (
                  <div key={c.id} className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
                    {/* Brand + title */}
                    <div>
                      <p className="text-[12px] font-semibold text-[#6A6C6A] mb-1">
                        {c.brand_profiles?.company_name ?? 'A brand'}
                      </p>
                      <h2 className="text-[17px] font-black text-[#121511] line-clamp-2">{c.title}</h2>
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-[13px] text-[#6A6C6A] leading-relaxed line-clamp-3">{c.description}</p>
                    )}

                    {/* Niches */}
                    {(c.target_niche ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(c.target_niche ?? []).slice(0, 4).map(n => (
                          <span key={n} className="px-2.5 py-1 rounded-full bg-[#EDEFEB] text-[11px] font-semibold text-[#4A4C4A]">
                            {n}
                          </span>
                        ))}
                        {(c.target_niche?.length ?? 0) > 4 && (
                          <span className="px-2.5 py-1 rounded-full bg-[#EDEFEB] text-[11px] font-semibold text-[#4A4C4A]">
                            +{(c.target_niche?.length ?? 0) - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-[12px] text-[#6A6C6A]">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {formatINR(c.budget_inr)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(c.deadline)}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="mt-auto pt-2 flex flex-col gap-2">
                      {application?.status === 'accepted' && application.contractId ? (
                        <Link
                          href={`/contracts/${application.contractId}`}
                          className="block w-full text-center px-4 py-2.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1f4a00] transition-colors"
                        >
                          Open contract
                        </Link>
                      ) : application?.status === 'rejected' ? (
                        <div className="w-full text-center px-4 py-2.5 rounded-[12px] bg-[#EDEFEB] text-[#6A6C6A] text-[14px] font-semibold">
                          Application rejected
                        </div>
                      ) : application?.status === 'pending' ? (
                        <>
                          <div className="w-full text-center px-4 py-2.5 rounded-[12px] bg-[#9FE870]/20 text-[#163300] text-[14px] font-semibold">
                            Applied · awaiting review
                          </div>
                          {application.applicationId && (
                            <button
                              onClick={() => withdrawApplication(c.id)}
                              disabled={withdrawingId === c.id}
                              className="w-full px-4 py-2 rounded-[12px] text-[13px] font-semibold text-[#6A6C6A] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {withdrawingId === c.id ? 'Withdrawing…' : 'Withdraw application'}
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => openApply(c)}
                          className="w-full px-4 py-2.5 rounded-[12px] bg-[#9FE870] text-[#163300] text-[14px] font-bold hover:bg-[#8fdc60] transition-colors"
                        >
                          Apply now
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyingTo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[520px] shadow-xl">
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-[#E8E8E8]">
              <div>
                <h2 className="text-[18px] font-black text-[#121511]">Apply to campaign</h2>
                <p className="text-[13px] text-[#6A6C6A] mt-0.5">
                  {applyingTo.title}
                  {applyingTo.brand_profiles?.company_name ? ` · ${applyingTo.brand_profiles.company_name}` : ''}
                </p>
              </div>
              <button onClick={() => setApplyingTo(null)} className="text-[#B0B2AF] hover:text-[#121511] transition-colors mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitApply)} className="p-6 flex flex-col gap-5">
              {/* Cover note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-[#121511]">Cover note</label>
                <textarea
                  rows={5}
                  placeholder="Why are you a fit? Past relevant work, ideas for the brief, audience match..."
                  className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] resize-none"
                  {...register('cover_note')}
                />
                {errors.cover_note && (
                  <p className="text-[12px] text-red-600">{errors.cover_note.message}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-[#121511]">Proposed price (₹)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="e.g. 12000"
                  className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300]"
                  {...register('proposed_price_inr', { valueAsNumber: true })}
                />
                {errors.proposed_price_inr && (
                  <p className="text-[12px] text-red-600">{errors.proposed_price_inr.message}</p>
                )}
                {applyingTo.budget_inr != null && (
                  <p className="text-[12px] text-[#6A6C6A]">Brand&rsquo;s posted budget: {formatINR(applyingTo.budget_inr)}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setApplyingTo(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] text-[14px] font-semibold text-[#121511] hover:bg-[#EDEFEB] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : 'Submit application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
