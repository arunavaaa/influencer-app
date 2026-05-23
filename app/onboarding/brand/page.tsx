'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, ChevronLeft, Loader2, Upload, Camera, Globe, Link2 } from 'lucide-react'

const APP_NAME = 'Crayon'
const STORAGE_KEY = 'brand_onboarding_progress'
const TOTAL_STEPS = 6

const LabelStyle = 'block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const InputStyle =
  'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Bhopal', 'Other',
]

const CATEGORIES = [
  { emoji: '👗', label: 'Fashion' },
  { emoji: '💄', label: 'Beauty & Skincare' },
  { emoji: '🍜', label: 'Food & Drink' },
  { emoji: '💪', label: 'Fitness & Wellness' },
  { emoji: '💻', label: 'Tech & Gadgets' },
  { emoji: '💰', label: 'Finance' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '👨‍👩‍👧', label: 'Parenting' },
  { emoji: '😂', label: 'Comedy' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🏎️', label: 'Automotive' },
  { emoji: '🌿', label: 'Lifestyle' },
]

interface BrandData {
  company_name: string
  company_description: string
  company_city: string
  logo_url: string | null
  cover_url: string | null
  website_url: string
  instagram_handle: string
  linkedin_url: string
  gst_number: string
  onboarding_goal: string
  business_type: string
  preferred_platforms: string[]
  interested_categories: string[]
  company_size: string
  monthly_budget: string
}

const EMPTY_DATA: BrandData = {
  company_name: '',
  company_description: '',
  company_city: '',
  logo_url: null,
  cover_url: null,
  website_url: '',
  instagram_handle: '',
  linkedin_url: '',
  gst_number: '',
  onboarding_goal: '',
  business_type: '',
  preferred_platforms: [],
  interested_categories: [],
  company_size: '',
  monthly_budget: '',
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function BrandOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<BrandData>(EMPTY_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('error') === 'creator_account') {
        window.history.replaceState({}, '', '/onboarding/brand')
        await supabase.auth.signOut()
        toast.error("That Google account is already registered as a creator on Crayon. Please choose a different account to sign up as a brand.")
        router.replace('/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (userData?.role === 'influencer') {
        toast.error("This account is already registered as a creator. Please sign in with a different account to join as a brand.")
        router.replace('/influencer/home')
        return
      }
      if (userData?.role === 'brand') { router.replace('/brand/home'); return }

      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setData({ ...EMPTY_DATA, ...parsed })
          if (parsed.__step && typeof parsed.__step === 'number') {
            setStep(Math.min(Math.max(parsed.__step, 1), TOTAL_STEPS))
          }
        }
      } catch { /* ignore */ }
      setReady(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, __step: step }))
    } catch { /* ignore */ }
  }, [data, step, ready])

  function patch(updates: Partial<BrandData>) {
    setData(prev => ({ ...prev, ...updates }))
  }

  function goBack() { setStep(s => Math.max(1, s - 1)) }

  async function handleFinalSubmit() {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Session expired — please sign in again'); router.push('/login'); return }

      const { data: existingUser } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (existingUser?.role === 'influencer') {
        toast.error("This account is already registered as a creator.")
        setSubmitting(false)
        return
      }

      await supabase.from('users').upsert({ id: user.id, email: user.email, role: 'brand' })

      const { error } = await supabase.from('brand_profiles').upsert(
        {
          user_id: user.id,
          company_name: data.company_name,
          logo_url: data.logo_url || null,
          website_url: data.website_url || null,
          gst_number: data.gst_number || null,
          // Extended fields — require migration 002_brand_profile_fields.sql
          company_description: data.company_description || null,
          company_city: data.company_city || null,
          cover_url: data.cover_url || null,
          instagram_handle: data.instagram_handle || null,
          linkedin_url: data.linkedin_url || null,
          onboarding_goal: data.onboarding_goal || null,
          business_type: data.business_type || null,
          preferred_platforms: data.preferred_platforms.length ? data.preferred_platforms : ['Instagram'],
          interested_categories: data.interested_categories.length ? data.interested_categories : null,
          company_size: data.company_size || null,
          monthly_budget: data.monthly_budget || null,
        },
        { onConflict: 'user_id' }
      )

      if (error) {
        console.error('brand_profiles upsert error:', error)
        throw error
      }

      localStorage.removeItem(STORAGE_KEY)
      toast.success('Brand account ready! Welcome to Crayon.')
      router.push('/brand/home?welcome=true')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100

  if (!ready) return null

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter), Inter, Arial, sans-serif' }}>
      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-white border-b border-[#EDEFEB] h-16 flex items-center px-5 md:px-10">
        <span className="text-[18px] font-black text-[#163300]">{APP_NAME}</span>
        <div className="ml-auto flex items-center gap-5">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/onboarding/creator') }}
            className="text-[13px] text-[#6A6C6A] hover:text-[#163300] transition-colors"
          >
            Join as Creator
          </button>
          <button
            onClick={() => router.push('/login')}
            className="text-[13px] text-[#6A6C6A] hover:text-[#163300] transition-colors"
          >
            Save &amp; exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="fixed top-16 inset-x-0 z-40 h-1 bg-[#EDEFEB]">
        <div className="h-full bg-[#9FE870] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Main layout */}
      <div className="pt-[72px] min-h-screen flex flex-col">
        <div className="flex-1 px-5 md:px-10 lg:px-[60px] py-10 flex flex-col max-w-[680px] mx-auto w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#163300]/50 mb-2">
            Step {step} of {TOTAL_STEPS}
          </p>

          <div className="flex-1">
            {step === 1 && <BrandStep1 data={data} patch={patch} onNext={() => setStep(2)} />}
            {step === 2 && <BrandStep2 data={data} patch={patch} onNext={() => setStep(3)} onBack={goBack} />}
            {step === 3 && <BrandStep3 data={data} patch={patch} onNext={() => setStep(4)} onBack={goBack} />}
            {step === 4 && <BrandStep4 data={data} patch={patch} onNext={() => setStep(5)} onBack={goBack} />}
            {step === 5 && <BrandStep5 data={data} patch={patch} onNext={() => setStep(6)} onBack={goBack} />}
            {step === 6 && <BrandStep6 data={data} patch={patch} submitting={submitting} onSubmit={handleFinalSubmit} onBack={goBack} />}
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-10 justify-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const s = i + 1
              const isCompleted = s < step
              const isCurrent = s === step
              return (
                <button
                  key={s}
                  onClick={() => isCompleted && setStep(s)}
                  className={`rounded-full transition-all duration-200 ${
                    isCurrent
                      ? 'w-6 h-2.5 bg-[#163300] ring-2 ring-[#163300]/20 ring-offset-1'
                      : isCompleted
                      ? 'w-2.5 h-2.5 bg-[#9FE870] cursor-pointer hover:bg-[#163300]'
                      : 'w-2.5 h-2.5 bg-[#EDEFEB]'
                  }`}
                  aria-label={`Go to step ${s}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   UPLOAD HELPER
════════════════════════════════════════════════ */
async function uploadViaApi(file: File, folder: string): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) return null
  const { url } = await res.json()
  return url
}

/* ════════════════════════════════════════════════
   STEP 1 — Brand Identity
════════════════════════════════════════════════ */
function BrandStep1({ data, patch, onNext }: {
  data: BrandData; patch: (u: Partial<BrandData>) => void; onNext: () => void
}) {
  const logoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)

  async function handleLogo(file: File) {
    setUploading('logo')
    const url = await uploadViaApi(file, 'brand/logos')
    if (url) { patch({ logo_url: url }); toast.success('Logo uploaded!') }
    else toast.error('Upload failed — please try again')
    setUploading(null)
  }

  async function handleCover(file: File) {
    setUploading('cover')
    const url = await uploadViaApi(file, 'brand/covers')
    if (url) { patch({ cover_url: url }); toast.success('Cover photo uploaded!') }
    else toast.error('Upload failed — please try again')
    setUploading(null)
  }

  function validate() {
    if (!data.company_name.trim()) { toast.error('Company name is required'); return }
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Tell us about your brand
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        This is what creators see when reviewing your campaigns and offers.
      </p>

      {/* Cover photo */}
      <div className="mb-6">
        <label className={LabelStyle}>
          Cover photo{' '}
          <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
        </label>
        <button
          onClick={() => coverRef.current?.click()}
          disabled={uploading === 'cover'}
          className="w-full h-[140px] rounded-2xl border-2 border-dashed border-[#163300]/20 hover:border-[#163300]/50 transition-colors overflow-hidden relative group"
        >
          {data.cover_url ? (
            <img src={data.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#9FE870]/20 to-[#163300]/10 flex flex-col items-center justify-center gap-2">
              {uploading === 'cover'
                ? <Loader2 className="w-6 h-6 animate-spin text-[#163300]" />
                : <><Upload className="w-6 h-6 text-[#163300]/40" /><span className="text-[13px] text-[#6A6C6A]">Upload cover photo</span></>
              }
            </div>
          )}
          {data.cover_url && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[13px] font-semibold">Change cover</span>
            </div>
          )}
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleCover(e.target.files[0])} />
      </div>

      {/* Logo + name row */}
      <div className="flex items-start gap-4 mb-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <button
            onClick={() => logoRef.current?.click()}
            disabled={uploading === 'logo'}
            className="w-[80px] h-[80px] rounded-2xl border-2 border-dashed border-[#163300]/20 hover:border-[#163300]/50 transition-colors overflow-hidden relative group"
          >
            {data.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#EDEFEB] flex flex-col items-center justify-center gap-1">
                {uploading === 'logo'
                  ? <Loader2 className="w-5 h-5 animate-spin text-[#163300]" />
                  : <><Camera className="w-5 h-5 text-[#163300]/40" /><span className="text-[9px] text-[#6A6C6A]">Logo</span></>
                }
              </div>
            )}
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleLogo(e.target.files[0])} />
        </div>

        {/* Company name */}
        <div className="flex-1">
          <label className={LabelStyle}>Company Name *</label>
          <input
            type="text"
            value={data.company_name}
            onChange={e => patch({ company_name: e.target.value })}
            placeholder="e.g. Mamaearth"
            className={InputStyle}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className={LabelStyle}>
          About your brand{' '}
          <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
        </label>
        <textarea
          value={data.company_description}
          onChange={e => patch({ company_description: e.target.value })}
          placeholder="Tell creators what your brand is about, what you stand for, and the kind of collaborations you're looking for..."
          rows={3}
          maxLength={400}
          className={`${InputStyle} resize-none`}
        />
        <p className="text-[12px] text-[#6A6C6A] mt-1 text-right">{data.company_description.length}/400</p>
      </div>

      {/* GST */}
      <div className="mb-8">
        <label className={LabelStyle}>
          GST Number{' '}
          <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
        </label>
        <input
          type="text"
          value={data.gst_number}
          onChange={e => patch({ gst_number: e.target.value })}
          placeholder="e.g. 22AAAAA0000A1Z5"
          className={InputStyle}
        />
        <p className="text-[12px] text-[#6A6C6A] mt-1">Required for GST-compliant invoices.</p>
      </div>

      <div className="flex items-start gap-2 bg-[#EDEFEB] rounded-2xl p-4 mb-8">
        <span className="text-[16px]">💡</span>
        <p className="text-[13px] text-[#6A6C6A]">
          Brands with a logo and description get <span className="font-bold text-[#163300]">2× faster</span> responses from top creators.
        </p>
      </div>

      <button onClick={validate}
        className="w-full bg-[#9FE870] text-[#163300] font-bold text-[16px] py-4 rounded-full hover:bg-[#8fdc60] transition-colors">
        Continue
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 2 — Online Presence
════════════════════════════════════════════════ */
function BrandStep2({ data, patch, onNext, onBack }: {
  data: BrandData; patch: (u: Partial<BrandData>) => void; onNext: () => void; onBack: () => void
}) {
  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Your online presence
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        Creators check these to verify you&rsquo;re a legitimate brand before accepting work.
      </p>

      <div className="space-y-5 mb-8">
        {/* Website */}
        <div>
          <label className={LabelStyle}>Website URL</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
            <input
              type="url"
              value={data.website_url}
              onChange={e => patch({ website_url: e.target.value })}
              placeholder="https://yoursite.com"
              className={`${InputStyle} pl-11`}
            />
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label className={LabelStyle}>
            Instagram Handle{' '}
            <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6A6C6A]">@</span>
            <input
              type="text"
              value={data.instagram_handle}
              onChange={e => patch({ instagram_handle: e.target.value.replace('@', '') })}
              placeholder="yourbrand"
              className={`${InputStyle} pl-9`}
            />
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <label className={LabelStyle}>
            LinkedIn URL{' '}
            <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
          </label>
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
            <input
              type="url"
              value={data.linkedin_url}
              onChange={e => patch({ linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/company/yourbrand"
              className={`${InputStyle} pl-11`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-[#EDEFEB] rounded-2xl p-4 mb-8">
        <span className="text-[16px]">🔗</span>
        <p className="text-[13px] text-[#6A6C6A]">
          Creators are <span className="font-bold text-[#163300]">3× more likely</span> to accept offers from brands with a verified web presence.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors">
          Continue
        </button>
      </div>

      <button onClick={onNext}
        className="w-full text-center text-[13px] text-[#6A6C6A] hover:text-[#163300] mt-4 transition-colors">
        Skip for now — add links later
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 3 — Campaign Goal
════════════════════════════════════════════════ */
function BrandStep3({ data, patch, onNext, onBack }: {
  data: BrandData; patch: (u: Partial<BrandData>) => void; onNext: () => void; onBack: () => void
}) {
  const GOALS = [
    { val: 'content', label: 'Get content for my brand', desc: 'UGC, product photos, and videos for ads' },
    { val: 'campaign', label: 'Run an influencer campaign', desc: 'Creators post to their audience for reach' },
    { val: 'both', label: 'Both — content + reach', desc: 'Get content and run campaigns together' },
    { val: 'explore', label: 'Just exploring', desc: "Browsing to see what's available" },
  ]

  function validate() {
    if (!data.onboarding_goal) { toast.error('Please select a goal to continue'); return }
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        What&rsquo;s your main goal?
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        We&rsquo;ll personalise your Crayon experience based on this.
      </p>

      <div className="flex flex-col gap-3 mb-8">
        {GOALS.map(({ val, label, desc }) => (
          <button
            key={val}
            onClick={() => { patch({ onboarding_goal: val }); }}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
              data.onboarding_goal === val
                ? 'border-[#163300] bg-[#163300] text-white'
                : 'border-[#EDEFEB] bg-white text-[#121511] hover:border-[#163300]/40'
            }`}
          >
            <div>
              <p className="text-[16px] font-bold">{label}</p>
              <p className={`text-[13px] mt-0.5 ${data.onboarding_goal === val ? 'text-white/60' : 'text-[#6A6C6A]'}`}>
                {desc}
              </p>
            </div>
            {data.onboarding_goal === val && (
              <div className="w-6 h-6 bg-[#9FE870] rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <Check className="w-4 h-4 text-[#163300]" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={validate}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors">
          Continue
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 4 — Business Details
════════════════════════════════════════════════ */
function BrandStep4({ data, patch, onNext, onBack }: {
  data: BrandData; patch: (u: Partial<BrandData>) => void; onNext: () => void; onBack: () => void
}) {
  const BUSINESS_TYPES = [
    { val: 'ecommerce', label: 'E-commerce / D2C', emoji: '🛒' },
    { val: 'saas', label: 'SaaS / App', emoji: '💻' },
    { val: 'agency', label: 'Marketing Agency', emoji: '📣' },
    { val: 'local', label: 'Local Business', emoji: '🏪' },
    { val: 'startup', label: 'Startup', emoji: '🚀' },
    { val: 'other', label: 'Other', emoji: '✨' },
  ]
  const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–500', '500+']

  function validate() {
    if (!data.business_type) { toast.error('Please select your business type'); return }
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        About your business
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        Helps us suggest the right creator tiers for your campaigns.
      </p>

      {/* Business type */}
      <div className="mb-7">
        <label className={LabelStyle}>Business type *</label>
        <div className="grid grid-cols-2 gap-3">
          {BUSINESS_TYPES.map(({ val, label, emoji }) => (
            <button
              key={val}
              onClick={() => patch({ business_type: val })}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                data.business_type === val
                  ? 'border-[#163300] bg-[#163300] text-white'
                  : 'border-[#EDEFEB] bg-white text-[#121511] hover:border-[#163300]/30'
              }`}
            >
              <span className="text-[20px] flex-shrink-0">{emoji}</span>
              <span className="text-[14px] font-semibold leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div className="mb-7">
        <label className={LabelStyle}>
          Company location{' '}
          <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
        </label>
        <select
          value={data.company_city}
          onChange={e => patch({ company_city: e.target.value })}
          className={InputStyle}
        >
          <option value="">Select city</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Team size */}
      <div className="mb-8">
        <label className={LabelStyle}>
          Team size{' '}
          <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TEAM_SIZES.map(size => (
            <button
              key={size}
              onClick={() => patch({ company_size: size })}
              className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all border-2 ${
                data.company_size === size
                  ? 'bg-[#9FE870] border-[#163300] text-[#163300]'
                  : 'bg-[#EDEFEB] border-transparent text-[#6A6C6A] hover:border-[#163300]/30'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={validate}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors">
          Continue
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 5 — Content Categories
════════════════════════════════════════════════ */
function BrandStep5({ data, patch, onNext, onBack }: {
  data: BrandData; patch: (u: Partial<BrandData>) => void; onNext: () => void; onBack: () => void
}) {
  function toggleCategory(label: string) {
    const cur = data.interested_categories
    patch({ interested_categories: cur.includes(label) ? cur.filter(c => c !== label) : [...cur, label] })
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        What content do you need?
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        Select the niches that match your brand. We&rsquo;ll show you the best matching creators first.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {CATEGORIES.map(({ emoji, label }) => {
          const selected = data.interested_categories.includes(label)
          return (
            <button
              key={label}
              onClick={() => toggleCategory(label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${
                selected
                  ? 'border-[#163300] bg-[#163300] text-white'
                  : 'border-[#EDEFEB] bg-white text-[#121511] hover:border-[#163300]/30'
              }`}
            >
              <span className="text-[26px] leading-none">{emoji}</span>
              <span className="text-[12px] font-semibold text-center leading-tight">{label}</span>
              {selected && (
                <div className="w-4 h-4 bg-[#9FE870] rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#163300]" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {data.interested_categories.length > 0 && (
        <p className="text-[13px] text-[#163300] font-semibold mb-6 text-center">
          {data.interested_categories.length} categor{data.interested_categories.length === 1 ? 'y' : 'ies'} selected
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors">
          Continue
        </button>
      </div>

      <button onClick={onNext}
        className="w-full text-center text-[13px] text-[#6A6C6A] hover:text-[#163300] mt-4 transition-colors">
        Skip — I&rsquo;ll explore all categories
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 6 — Budget
════════════════════════════════════════════════ */
function BrandStep6({ data, patch, submitting, onSubmit, onBack }: {
  data: BrandData; patch: (u: Partial<BrandData>) => void
  submitting: boolean; onSubmit: () => void; onBack: () => void
}) {
  const BUDGETS = [
    { val: 'under_10k', label: 'Under ₹10,000', desc: 'Nano & micro creators' },
    { val: '10k_50k', label: '₹10,000 – ₹50,000', desc: 'Micro & mid-tier creators' },
    { val: '50k_2l', label: '₹50,000 – ₹2,00,000', desc: 'Mid-tier & macro creators' },
    { val: '2l_5l', label: '₹2,00,000 – ₹5,00,000', desc: 'Macro creators & celebrities' },
    { val: 'above_5l', label: '₹5,00,000+', desc: 'Full influencer campaigns' },
  ]

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Monthly influencer budget?
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        We&rsquo;ll show you creator tiers that fit your budget. You can change this anytime.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {BUDGETS.map(({ val, label, desc }) => (
          <button
            key={val}
            onClick={() => patch({ monthly_budget: val })}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
              data.monthly_budget === val
                ? 'border-[#163300] bg-[#163300] text-white'
                : 'border-[#EDEFEB] bg-white text-[#121511] hover:border-[#163300]/40'
            }`}
          >
            <div>
              <p className="text-[16px] font-bold">{label}</p>
              <p className={`text-[13px] mt-0.5 ${data.monthly_budget === val ? 'text-white/60' : 'text-[#6A6C6A]'}`}>
                {desc}
              </p>
            </div>
            {data.monthly_budget === val && (
              <div className="w-6 h-6 bg-[#9FE870] rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <Check className="w-4 h-4 text-[#163300]" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 bg-[#EDEFEB] rounded-2xl p-4 mb-8">
        <span className="text-[16px]">🔒</span>
        <p className="text-[13px] text-[#6A6C6A]">
          All payments go through <span className="font-bold text-[#163300]">escrow</span>. Funds are only released when you approve the content or after 72 hours.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account…</>
            : 'Start Hiring Creators →'
          }
        </button>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full text-center text-[13px] text-[#6A6C6A] hover:text-[#163300] mt-4 transition-colors disabled:opacity-40"
      >
        Skip — set budget later
      </button>
    </div>
  )
}
