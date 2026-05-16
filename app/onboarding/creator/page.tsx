'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Eye, EyeOff, Check, X, Loader2, Upload, Plus,
  ChevronLeft, Link as LinkIcon, Copy, Share2, ExternalLink,
  Camera,
} from 'lucide-react'

function IgIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
import CreatorProfilePreview, { OnboardingData } from '@/components/shared/CreatorProfilePreview'

const APP_NAME = 'Crayon'
const STORAGE_KEY = 'creator_onboarding_progress'

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Bhopal', 'Other',
]

const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
]

const NICHES = [
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

const DEFAULT_PACKAGES: OnboardingData['packages'] = [
  { format: 'Reel', price: null, deliveryDays: 5, revisions: 2, description: '', enabled: true },
  { format: 'Post', price: null, deliveryDays: 3, revisions: 2, description: '', enabled: true },
  { format: 'Story', price: null, deliveryDays: 2, revisions: 1, description: '', enabled: true },
]

const EMPTY_DATA: OnboardingData = {
  username: '',
  displayName: '',
  profileTitle: '',
  city: '',
  languages: [],
  bio: '',
  niches: [],
  profilePhotoUrl: null,
  instagramConnected: false,
  instagramHandle: '',
  followerCount: null,
  engagementRate: null,
  contentUrls: [],
  packages: DEFAULT_PACKAGES,
}

function getSuggestedPrice(followers: number | null): string {
  if (!followers) return ''
  if (followers < 10_000) return '₹2,000–₹5,000'
  if (followers < 50_000) return '₹5,000–₹15,000'
  if (followers < 100_000) return '₹15,000–₹35,000'
  if (followers < 500_000) return '₹35,000–₹1,00,000'
  return '₹1,00,000+'
}

/* ── label style ── */
const LabelStyle = 'block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const InputStyle =
  'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'
const ErrorStyle = 'text-[12px] text-red-500 mt-1'

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function CreatorOnboarding() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  /* Restore saved progress */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setData({ ...EMPTY_DATA, ...parsed })
        if (parsed.__step && typeof parsed.__step === 'number') {
          setStep(parsed.__step)
        }
      }
    } catch { /* ignore */ }
  }, [])

  /* Persist to localStorage on every change */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, __step: step }))
    } catch { /* ignore */ }
  }, [data, step])

  function patch(updates: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...updates }))
  }

  function clearErrors(...keys: string[]) {
    if (keys.length === 0) setErrors({})
    else setErrors(prev => {
      const next = { ...prev }
      keys.forEach(k => delete next[k])
      return next
    })
  }

  function setError(key: string, msg: string) {
    setErrors(prev => ({ ...prev, [key]: msg }))
  }

  function goBack() {
    if (step > 1) setStep(s => s - 1)
  }

  async function handleFinalSubmit() {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expired — please sign in again')
        router.push('/login')
        return
      }

      // 1. Upsert users row
      await supabase.from('users').upsert({ id: user.id, email: user.email, role: 'influencer' })

      // 2. Upsert influencer_profiles
      const { data: profile, error: profileError } = await supabase
        .from('influencer_profiles')
        .upsert({
          user_id: user.id,
          display_name: data.displayName,
          bio: data.bio,
          niche: data.niches,
          city: data.city,
          language: data.languages,
          is_profile_live: true,
          profile_photo_url: data.profilePhotoUrl,
        })
        .select('id')
        .single()

      if (profileError) throw profileError
      const profileId = profile.id

      // 3. Social account
      if (data.instagramConnected && data.instagramHandle) {
        await supabase.from('social_accounts').upsert({
          influencer_id: profileId,
          platform: 'instagram',
          handle_encrypted: data.instagramHandle,
          handle_masked: maskHandle(data.instagramHandle),
          follower_count: data.followerCount,
          engagement_rate: data.engagementRate,
        })
      }

      // 4. Packages
      for (const pkg of data.packages) {
        if (pkg.enabled && pkg.price) {
          await supabase.from('content_packages').insert({
            influencer_id: profileId,
            format: pkg.format,
            platform: 'instagram',
            price_inr: pkg.price,
            delivery_days: pkg.deliveryDays,
            revisions_allowed: pkg.revisions,
            description: pkg.description,
          })
        }
      }

      localStorage.removeItem(STORAGE_KEY)
      toast.success('Profile created! Welcome to Crayon 🎉')
      router.push('/influencer/home?welcome=true')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSteps = 7
  const progress = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter), Inter, Arial, sans-serif' }}>
      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-white border-b border-[#EDEFEB] h-16 flex items-center px-5 md:px-10">
        <span className="text-[18px] font-black text-[#163300]">{APP_NAME}</span>
        <div className="ml-auto flex items-center gap-4">
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
        <div
          className="h-full bg-[#9FE870] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main layout */}
      <div className="pt-[72px] min-h-screen flex flex-col lg:flex-row">
        {/* ── Left column ── */}
        <div className="flex-1 lg:w-[55%] px-5 md:px-10 lg:px-[60px] py-10 flex flex-col max-w-[700px] mx-auto lg:mx-0 w-full">
          {/* Step label */}
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#163300]/50 mb-2">
            Step {step} of {totalSteps}
          </p>

          {/* Step content */}
          <div className="flex-1">
            {step === 1 && (
              <Step1
                data={data} patch={patch} errors={errors}
                clearErrors={clearErrors} setError={setError}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2
                data={data} patch={patch}
                onNext={() => setStep(3)} onBack={goBack}
              />
            )}
            {step === 3 && (
              <Step3
                data={data} patch={patch} errors={errors}
                clearErrors={clearErrors}
                onNext={() => setStep(4)} onBack={goBack}
              />
            )}
            {step === 4 && (
              <Step4
                data={data} patch={patch} errors={errors}
                onNext={() => setStep(5)} onBack={goBack}
              />
            )}
            {step === 5 && (
              <Step5
                data={data} patch={patch}
                onNext={() => setStep(6)} onBack={goBack}
              />
            )}
            {step === 6 && (
              <Step6
                data={data} patch={patch} errors={errors}
                clearErrors={clearErrors}
                onNext={() => setStep(7)} onBack={goBack}
              />
            )}
            {step === 7 && (
              <Step7
                data={data}
                submitting={submitting}
                onSubmit={handleFinalSubmit}
                onBack={goBack}
              />
            )}
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-10 justify-center">
            {Array.from({ length: totalSteps }).map((_, i) => {
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

        {/* ── Right column: preview ── */}
        <div className="hidden lg:block lg:w-[45%] bg-[#EDEFEB] px-8 py-10">
          <div className="sticky top-[80px]">
            <CreatorProfilePreview data={data} isLive={step === 7} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 1 — Claim Your Profile
════════════════════════════════════════════════ */
function Step1({
  data, patch, errors, clearErrors, setError, onNext,
}: {
  data: OnboardingData
  patch: (u: Partial<OnboardingData>) => void
  errors: Record<string, string>
  clearErrors: (...keys: string[]) => void
  setError: (k: string, m: string) => void
  onNext: () => void
}) {
  const supabase = createClient()
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState(data.displayName)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function checkUsername(val: string) {
    if (val.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    const { data: existing } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('username', val)
      .maybeSingle()
    setUsernameStatus(existing ? 'taken' : 'available')
  }

  function onUsernameChange(val: string) {
    const cleaned = val.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30)
    patch({ username: cleaned })
    clearErrors('username')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (cleaned.length >= 3) {
      debounceRef.current = setTimeout(() => checkUsername(cleaned), 500)
    } else {
      setUsernameStatus('idle')
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/creator` },
    })
    if (error) toast.error(error.message)
  }

  async function handleEmailSignup() {
    const errs: Record<string, string> = {}
    if (!data.username || data.username.length < 3) errs.username = 'Username must be at least 3 characters'
    if (usernameStatus === 'taken') errs.username = 'This username is taken'
    if (!fullName.trim()) errs.fullName = 'Name is required'
    if (!email.includes('@')) errs.email = 'Enter a valid email'
    if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (!agreed) errs.terms = 'You must agree to the terms'
    if (Object.keys(errs).length) { errs && Object.entries(errs).forEach(([k, v]) => setError(k, v)); return }

    patch({ displayName: fullName })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { toast.error(error.message); return }
    onNext()
  }

  function validateAndNext() {
    const errs: Record<string, string> = {}
    if (!data.username || data.username.length < 3) errs.username = 'Username must be at least 3 characters'
    if (usernameStatus === 'taken') errs.username = 'This username is taken'
    if (Object.keys(errs).length) { Object.entries(errs).forEach(([k, v]) => setError(k, v)); return }
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Claim your creator profile
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        Your profile is your storefront. Brands will find and hire you here.
      </p>

      {/* Username */}
      <div className="mb-5">
        <label className={LabelStyle}>Your profile URL</label>
        <div className="flex items-center rounded-2xl border border-[#163300]/20 overflow-hidden focus-within:border-[#163300] transition-colors bg-white">
          <span className="px-4 py-3 text-[15px] text-[#6A6C6A] bg-[#EDEFEB] border-r border-[#163300]/20 whitespace-nowrap flex-shrink-0">
            crayon.in/
          </span>
          <input
            type="text"
            value={data.username}
            onChange={e => onUsernameChange(e.target.value)}
            placeholder="your_username"
            className="flex-1 px-4 py-3 text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none bg-white"
          />
          <span className="px-3 flex-shrink-0">
            {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-[#6A6C6A]" />}
            {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
            {usernameStatus === 'taken' && <X className="w-4 h-4 text-red-500" />}
          </span>
        </div>
        {usernameStatus === 'available' && (
          <p className="text-[12px] text-green-600 mt-1">Username is available!</p>
        )}
        {usernameStatus === 'taken' && (
          <p className="text-[12px] text-red-500 mt-1">This username is taken. Try another.</p>
        )}
        {errors.username && <p className={ErrorStyle}>{errors.username}</p>}
        <p className="text-[12px] text-[#6A6C6A] mt-1">Letters, numbers, underscores only. Min 3, max 30 characters.</p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-[#163300]/15 text-[15px] font-semibold text-[#121511] hover:border-[#163300]/40 hover:bg-[#EDEFEB]/50 transition-all mb-4"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#EDEFEB]" />
        <span className="text-[13px] text-[#6A6C6A]">or</span>
        <div className="flex-1 h-px bg-[#EDEFEB]" />
      </div>

      {/* Email fields */}
      <div className="space-y-4 mb-5">
        <div>
          <label className={LabelStyle}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => { setFullName(e.target.value); clearErrors('fullName') }}
            placeholder="e.g. Priya Sharma"
            className={InputStyle}
          />
          {errors.fullName && <p className={ErrorStyle}>{errors.fullName}</p>}
        </div>
        <div>
          <label className={LabelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); clearErrors('email') }}
            placeholder="you@example.com"
            className={InputStyle}
          />
          {errors.email && <p className={ErrorStyle}>{errors.email}</p>}
        </div>
        <div>
          <label className={LabelStyle}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearErrors('password') }}
              placeholder="At least 6 characters"
              className={`${InputStyle} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6A6C6A] hover:text-[#163300]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className={ErrorStyle}>{errors.password}</p>}
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <div
          onClick={() => setAgreed(v => !v)}
          className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${
            agreed ? 'bg-[#163300] border-[#163300]' : 'border-[#163300]/30 bg-white'
          }`}
        >
          {agreed && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className="text-[13px] text-[#6A6C6A]">
          I agree to the{' '}
          <span className="text-[#163300] font-semibold underline cursor-pointer">Terms</span> and{' '}
          <span className="text-[#163300] font-semibold underline cursor-pointer">Privacy Policy</span>
        </span>
      </label>
      {errors.terms && <p className={`${ErrorStyle} -mt-4 mb-4`}>{errors.terms}</p>}

      <button
        onClick={handleEmailSignup}
        className="w-full bg-[#9FE870] text-[#163300] font-bold text-[16px] py-4 rounded-full hover:bg-[#8fdc60] transition-colors"
      >
        Create My Profile
      </button>

      <p className="text-center text-[13px] text-[#6A6C6A] mt-4">
        Already have an account?{' '}
        <a href="/login" className="text-[#163300] font-semibold hover:underline">Sign in</a>
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 2 — Connect Instagram
════════════════════════════════════════════════ */
function Step2({
  data, patch, onNext, onBack,
}: {
  data: OnboardingData
  patch: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  function handleMockConnect() {
    patch({
      instagramConnected: true,
      instagramHandle: 'yourhandle',
      followerCount: 45200,
      engagementRate: 4.8,
    })
    toast.success('Instagram connected!')
  }

  function handleSkip() {
    patch({ instagramHandle: 'skip' })
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Connect your Instagram
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-10">
        We pull your real stats directly from Instagram — no fake followers, no guessing.
        Brands trust verified profiles 3× more.
      </p>

      {/* Instagram icon */}
      <div className="flex justify-center mb-8">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}
        >
          <IgIcon className="w-10 h-10 text-white" />
        </div>
      </div>

      {data.instagramConnected ? (
        /* Success card */
        <div className="bg-[#EDEFEB] rounded-3xl p-6 mb-6 border border-[#9FE870]/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f09433] to-[#bc1888] flex items-center justify-center">
              <span className="text-white text-xl font-black">@</span>
            </div>
            <div>
              <p className="text-[16px] font-black text-[#121511]">@{data.instagramHandle}</p>
              <p className="text-[13px] text-[#6A6C6A]">
                {data.followerCount ? `${(data.followerCount / 1000).toFixed(1)}K Followers` : ''} ·{' '}
                {data.engagementRate ? `${data.engagementRate}% Engagement` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#9FE870]/20 border border-[#9FE870] rounded-2xl px-4 py-2.5">
            <Check className="w-4 h-4 text-[#163300]" />
            <span className="text-[13px] font-bold text-[#163300]">Instagram Verified</span>
          </div>
          <button
            onClick={() => patch({ instagramConnected: false, instagramHandle: '', followerCount: null, engagementRate: null })}
            className="text-[13px] text-[#6A6C6A] hover:text-red-500 mt-3 block transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleMockConnect}
          className="w-full flex items-center justify-center gap-3 bg-[#163300] text-white font-bold text-[16px] py-4 rounded-full hover:bg-[#1f4a00] transition-colors mb-4"
        >
          <IgIcon className="w-5 h-5" />
          Connect Instagram
        </button>
      )}

      <p className="text-center text-[12px] text-[#6A6C6A] mb-8">
        We only read your public stats. We never post on your behalf.
      </p>

      {/* Nav */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={data.instagramConnected ? onNext : () => { }}
          disabled={!data.instagramConnected}
          className={`flex-1 py-3.5 rounded-full font-bold text-[16px] transition-colors ${
            data.instagramConnected
              ? 'bg-[#9FE870] text-[#163300] hover:bg-[#8fdc60]'
              : 'bg-[#EDEFEB] text-[#6A6C6A] cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>

      <button
        onClick={handleSkip}
        className="w-full text-center text-[13px] text-[#6A6C6A] hover:text-[#163300] mt-4 transition-colors"
      >
        Skip for now — you can connect later
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 3 — Profile Details
════════════════════════════════════════════════ */
function Step3({
  data, patch, errors, clearErrors, onNext, onBack,
}: {
  data: OnboardingData
  patch: (u: Partial<OnboardingData>) => void
  errors: Record<string, string>
  clearErrors: (...keys: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const AI_SUGGESTION = '✨ Lifestyle & Beauty Creator'

  function validate() {
    if (!data.displayName.trim()) { toast.error('Please enter your display name'); return }
    if (!data.city) { toast.error('Please select your city'); return }
    if (data.languages.length === 0) { toast.error('Please select at least one language'); return }
    onNext()
  }

  function toggleLanguage(lang: string) {
    const langs = data.languages.includes(lang)
      ? data.languages.filter(l => l !== lang)
      : [...data.languages, lang]
    patch({ languages: langs })
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Tell brands about yourself
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        This is what shows up when brands search for creators.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className={LabelStyle}>Display Name</label>
          <input
            type="text"
            value={data.displayName}
            onChange={e => { patch({ displayName: e.target.value }); clearErrors('displayName') }}
            placeholder="e.g. Priya Sharma"
            className={InputStyle}
          />
        </div>
        <div>
          <label className={LabelStyle}>Profile Title</label>
          <div className="relative">
            <input
              type="text"
              value={data.profileTitle}
              onChange={e => patch({ profileTitle: e.target.value })}
              placeholder="e.g. Fashion & Lifestyle Creator, Mumbai"
              className={InputStyle}
            />
          </div>
          <button
            onClick={() => patch({ profileTitle: 'Lifestyle & Beauty Creator' })}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#163300] bg-[#9FE870]/30 px-3 py-1 rounded-full hover:bg-[#9FE870]/50 transition-colors"
          >
            {AI_SUGGESTION}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <label className={LabelStyle}>City</label>
        <select
          value={data.city}
          onChange={e => patch({ city: e.target.value })}
          className={`${InputStyle} cursor-pointer`}
        >
          <option value="">Select your city</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-5">
        <label className={LabelStyle}>Languages</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all ${
                data.languages.includes(lang)
                  ? 'bg-[#9FE870] text-[#163300]'
                  : 'bg-[#EDEFEB] text-[#6A6C6A] hover:bg-[#EDEFEB]/80'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className={LabelStyle}>Bio</label>
        <div className="relative">
          <textarea
            value={data.bio}
            onChange={e => patch({ bio: e.target.value.slice(0, 300) })}
            placeholder="e.g. I create fashion and lifestyle content for young Indian women. My audience is 72% female, 18–28, based in Mumbai and Delhi."
            rows={4}
            className={`${InputStyle} resize-none`}
          />
          <span className="absolute bottom-3 right-4 text-[12px] text-[#6A6C6A]">
            {data.bio.length}/300
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={validate}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 4 — Your Niche
════════════════════════════════════════════════ */
function Step4({
  data, patch, errors, onNext, onBack,
}: {
  data: OnboardingData
  patch: (u: Partial<OnboardingData>) => void
  errors: Record<string, string>
  onNext: () => void
  onBack: () => void
}) {
  function toggleNiche(label: string) {
    const niches = data.niches.includes(label)
      ? data.niches.filter(n => n !== label)
      : [...data.niches, label]
    patch({ niches })
  }

  function validate() {
    if (data.niches.length === 0) { toast.error('Select at least one niche to continue'); return }
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        What kind of content do you create?
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        Select all that apply. Brands filter by niche to find the right creator.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {NICHES.map(({ emoji, label }) => {
          const selected = data.niches.includes(label)
          return (
            <button
              key={label}
              onClick={() => toggleNiche(label)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${
                selected
                  ? 'bg-[#9FE870] border-[#163300] text-[#163300]'
                  : 'bg-white border-[#EDEFEB] text-[#6A6C6A] hover:border-[#163300]/30'
              }`}
            >
              <span className="text-[26px] leading-none">{emoji}</span>
              <span className="text-[12px] font-semibold text-center leading-tight">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 bg-[#EDEFEB] rounded-2xl p-4 mb-8">
        <span className="text-[16px]">💡</span>
        <p className="text-[13px] text-[#6A6C6A]">
          Profiles with 2–3 niches get <span className="font-bold text-[#163300]">40% more</span> brand enquiries than those with only 1.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={validate}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors"
        >
          Continue{data.niches.length > 0 ? ` with ${data.niches.length} niche${data.niches.length > 1 ? 's' : ''}` : ''}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 5 — Showcase Content
════════════════════════════════════════════════ */
function Step5({
  data, patch, onNext, onBack,
}: {
  data: OnboardingData
  patch: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const supabase = createClient()
  const photoRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `photos/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('creator-portfolio').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('creator-portfolio').getPublicUrl(path)
      patch({ profilePhotoUrl: urlData.publicUrl })
      toast.success('Profile photo uploaded!')
    } else {
      toast.error('Upload failed — check storage bucket permissions')
    }
    setUploading(false)
  }

  async function handleContentUpload(files: FileList) {
    setUploading(true)
    const newUrls: string[] = []
    for (let i = 0; i < Math.min(files.length, 12 - data.contentUrls.length); i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const path = `content/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from('creator-portfolio').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('creator-portfolio').getPublicUrl(path)
        newUrls.push(urlData.publicUrl)
      }
    }
    patch({ contentUrls: [...data.contentUrls, ...newUrls] })
    if (newUrls.length) toast.success(`${newUrls.length} file${newUrls.length > 1 ? 's' : ''} uploaded!`)
    setUploading(false)
  }

  function removeContent(idx: number) {
    patch({ contentUrls: data.contentUrls.filter((_, i) => i !== idx) })
  }

  const [dragOver, setDragOver] = useState(false)

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Show brands what you create
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        Upload your best Instagram posts, Reels and stories. Brands decide based on content quality.
      </p>

      {/* Profile photo uploader */}
      <div className="flex items-center gap-5 mb-8">
        <button
          onClick={() => photoRef.current?.click()}
          className="w-[88px] h-[88px] rounded-full border-2 border-dashed border-[#163300]/30 bg-[#EDEFEB] flex flex-col items-center justify-center gap-1 hover:border-[#163300] transition-colors overflow-hidden relative flex-shrink-0"
        >
          {data.profilePhotoUrl ? (
            <img src={data.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-[#6A6C6A]" />
              <span className="text-[10px] text-[#6A6C6A] font-medium">Add photo</span>
            </>
          )}
        </button>
        <div>
          <p className="text-[15px] font-semibold text-[#121511]">Profile photo</p>
          <p className="text-[13px] text-[#6A6C6A]">JPG or PNG, min 200×200px</p>
          <button
            onClick={() => photoRef.current?.click()}
            className="text-[13px] font-semibold text-[#163300] hover:underline mt-1"
          >
            {data.profilePhotoUrl ? 'Change photo' : 'Upload photo'}
          </button>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]) }}
        />
      </div>

      {/* Content grid uploader */}
      <div className="mb-6">
        <label className={LabelStyle}>Content Portfolio</label>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false)
            if (e.dataTransfer.files) handleContentUpload(e.dataTransfer.files)
          }}
          onClick={() => contentRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? 'border-[#163300] bg-[#9FE870]/10' : 'border-[#163300]/20 hover:border-[#163300]/50 hover:bg-[#EDEFEB]/50'
          }`}
        >
          <Upload className="w-8 h-8 text-[#6A6C6A] mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-[#121511]">Drop your best content here</p>
          <p className="text-[13px] text-[#6A6C6A] mt-1">or click to upload</p>
          <p className="text-[12px] text-[#6A6C6A] mt-2">JPG, PNG, MP4 · Max 50MB each · Up to 12 files</p>
          {uploading && <Loader2 className="w-5 h-5 animate-spin text-[#163300] mx-auto mt-3" />}
        </div>
        <input
          ref={contentRef}
          type="file"
          accept="image/*,video/mp4"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) handleContentUpload(e.target.files) }}
        />
      </div>

      {/* Uploaded grid */}
      {data.contentUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {data.contentUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden bg-[#EDEFEB]">
              {url.endsWith('.mp4') ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeContent(i)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="flex items-start gap-2 bg-[#EDEFEB] rounded-2xl p-4 mb-8">
        <span className="text-[16px]">📸</span>
        <p className="text-[13px] text-[#6A6C6A]">
          Profiles with 6+ content samples receive <span className="font-bold text-[#163300]">3× more</span> brand enquiries.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors"
        >
          Continue
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full text-center text-[13px] text-[#6A6C6A] hover:text-[#163300] mt-4 transition-colors"
      >
        Skip for now — add content later from your dashboard
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 6 — Packages & Pricing
════════════════════════════════════════════════ */
function Step6({
  data, patch, errors, clearErrors, onNext, onBack,
}: {
  data: OnboardingData
  patch: (u: Partial<OnboardingData>) => void
  errors: Record<string, string>
  clearErrors: (...keys: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [upiId, setUpiId] = useState('')

  const suggestedPrice = getSuggestedPrice(data.followerCount)

  function updatePackage(i: number, updates: Partial<OnboardingData['packages'][number]>) {
    const packages = data.packages.map((p, idx) => idx === i ? { ...p, ...updates } : p)
    patch({ packages })
  }

  function validate() {
    const hasPrice = data.packages.some(p => p.enabled && p.price && p.price > 0)
    if (!hasPrice) { toast.error('Please set a price for at least one package'); return }
    onNext()
  }

  return (
    <div>
      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2">
        Set your content packages
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8">
        These are the offers brands can buy directly from your profile. You can always edit them later.
      </p>

      {/* Package cards */}
      <div className="space-y-4 mb-6">
        {data.packages.map((pkg, i) => (
          <PackageCard
            key={pkg.format}
            pkg={pkg}
            suggestedPrice={suggestedPrice}
            onChange={updates => updatePackage(i, updates)}
          />
        ))}
      </div>

      <button className="flex items-center gap-2 text-[14px] font-semibold text-[#163300] hover:text-[#1f4a00] mb-8 transition-colors">
        <Plus className="w-4 h-4" />
        Add Custom Package
      </button>

      {/* Divider */}
      <div className="h-px bg-[#EDEFEB] mb-8" />

      {/* Payment details */}
      <div className="mb-8">
        <p className="text-[16px] font-black text-[#121511] mb-1">Add your UPI to receive payments instantly</p>
        <p className="text-[13px] text-[#6A6C6A] mb-4">Your payment details are encrypted and never shared with brands.</p>

        <div className="space-y-4">
          <div>
            <label className={LabelStyle}>UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className={InputStyle}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#EDEFEB]" />
            <span className="text-[12px] text-[#6A6C6A]">or bank account</span>
            <div className="flex-1 h-px bg-[#EDEFEB]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LabelStyle}>Account Number</label>
              <input type="text" placeholder="XXXXXXXXXXXXXX" className={InputStyle} />
            </div>
            <div>
              <label className={LabelStyle}>IFSC Code</label>
              <input type="text" placeholder="SBIN0000123" className={InputStyle} />
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="text-[13px] text-[#6A6C6A] hover:text-[#163300] mt-3 block transition-colors"
        >
          Add later from Settings
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={validate}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/* Package card sub-component */
function PackageCard({
  pkg, suggestedPrice, onChange,
}: {
  pkg: OnboardingData['packages'][number]
  suggestedPrice: string
  onChange: (u: Partial<OnboardingData['packages'][number]>) => void
}) {
  const FORMAT_ICONS: Record<string, string> = { Reel: '🎬', Post: '📸', Story: '⭕' }

  return (
    <div className={`rounded-3xl border-2 transition-all ${pkg.enabled ? 'border-[#163300]/20 bg-white' : 'border-[#EDEFEB] bg-[#EDEFEB]/30'}`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-[20px]">{FORMAT_ICONS[pkg.format]}</span>
          <div>
            <p className="text-[15px] font-black text-[#121511]">Instagram {pkg.format}</p>
            <span className="inline-flex items-center gap-1 bg-pink-50 text-pink-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              <IgIcon className="w-3 h-3" /> Instagram
            </span>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onChange({ enabled: !pkg.enabled })}
          className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${pkg.enabled ? 'bg-[#163300]' : 'bg-[#EDEFEB]'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${pkg.enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      {pkg.enabled && (
        <div className="px-5 pb-5 space-y-4">
          {/* Price */}
          <div>
            <label className={LabelStyle}>Price (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#163300]">₹</span>
              <input
                type="number"
                value={pkg.price ?? ''}
                onChange={e => onChange({ price: e.target.value ? Number(e.target.value) : null })}
                placeholder="0"
                className={`${InputStyle} pl-9`}
              />
            </div>
            {suggestedPrice && (
              <p className="text-[12px] text-[#6A6C6A] mt-1">
                Suggested for your audience size: <span className="font-semibold text-[#163300]">{suggestedPrice}</span>
              </p>
            )}
          </div>

          {/* Delivery + Revisions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LabelStyle}>Delivery Days</label>
              <input
                type="number"
                value={pkg.deliveryDays}
                onChange={e => onChange({ deliveryDays: Number(e.target.value) })}
                min={1}
                className={InputStyle}
              />
            </div>
            <div>
              <label className={LabelStyle}>Revisions</label>
              <input
                type="number"
                value={pkg.revisions}
                onChange={e => onChange({ revisions: Number(e.target.value) })}
                min={0}
                className={InputStyle}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${LabelStyle} mb-0`}>Description (optional)</label>
              <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+20% acceptance</span>
            </div>
            <textarea
              value={pkg.description}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="What's included? e.g. 1 Instagram Reel, 1 revision round, analytics report..."
              rows={2}
              className={`${InputStyle} resize-none`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   STEP 7 — You're Live!
════════════════════════════════════════════════ */
function Step7({
  data, submitting, onSubmit, onBack,
}: {
  data: OnboardingData
  submitting: boolean
  onSubmit: () => void
  onBack: () => void
}) {
  const confettiRef = useRef(false)
  const [copied, setCopied] = useState(false)

  const profileUrl = `crayon.in/${data.username}`

  /* Profile completeness */
  const checks = [
    !!data.displayName,
    !!data.profilePhotoUrl,
    data.contentUrls.length >= 3,
    data.niches.length > 0,
    data.languages.length > 0,
    !!data.bio,
    data.instagramConnected,
    data.packages.some(p => p.enabled && p.price),
  ]
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100)

  useEffect(() => {
    if (confettiRef.current) return
    confettiRef.current = true
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#9FE870', '#163300', '#EDEFEB', '#ffffff'],
      })
    })
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(`https://${profileUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out my creator profile on Crayon! https://${profileUrl}`)}`

  return (
    <div>
      {/* Animated checkmark */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#9FE870] flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
          <Check className="w-10 h-10 text-[#163300] stroke-[3]" strokeWidth={3} />
        </div>
      </div>

      <style>{`
        @keyframes scale-in { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>

      <h1 className="text-[36px] md:text-[44px] font-black text-[#163300] leading-tight mb-2 text-center">
        You&rsquo;re live! Welcome to {APP_NAME}.
      </h1>
      <p className="text-[16px] text-[#6A6C6A] mb-8 text-center">
        Your profile is now visible to 500+ Indian brands actively looking for Instagram creators.
      </p>

      {/* Profile URL */}
      <div className="bg-[#EDEFEB] rounded-2xl flex items-center gap-3 px-4 py-3 mb-6">
        <LinkIcon className="w-4 h-4 text-[#163300] flex-shrink-0" />
        <span className="text-[14px] font-semibold text-[#163300] flex-1 truncate">{profileUrl}</span>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 bg-white text-[#163300] text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-[#163300] hover:text-white transition-colors flex-shrink-0"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-3 mb-8">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-[14px] py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          <Share2 className="w-4 h-4" />
          WhatsApp
        </a>
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 bg-[#EDEFEB] text-[#163300] font-bold text-[14px] py-3 rounded-full hover:bg-[#E0E3DD] transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy Link
        </button>
      </div>

      {/* What's next cards */}
      <div className="space-y-3 mb-8">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#163300]/50">What&apos;s Next</p>

        {[
          { icon: '🔍', title: 'Browse open campaigns', desc: 'Brands looking for creators right now', href: '/influencer/campaigns' },
          { icon: '✏️', title: 'Complete your profile', desc: 'Add more content to boost visibility', href: '/influencer/home' },
          { icon: '📢', title: 'Share your profile', desc: 'Tell your audience you\'re open for collabs', action: copyLink },
        ].map((item, i) => (
          <a
            key={i}
            href={item.href}
            onClick={item.action ? e => { e.preventDefault(); item.action!() } : undefined}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#EDEFEB] hover:border-[#163300]/20 hover:shadow-sm transition-all group cursor-pointer"
          >
            <span className="text-[22px] flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#121511]">{item.title}</p>
              <p className="text-[12px] text-[#6A6C6A]">{item.desc}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-[#6A6C6A] group-hover:text-[#163300] flex-shrink-0 transition-colors" />
          </a>
        ))}
      </div>

      {/* Profile strength meter */}
      <div className="bg-[#EDEFEB] rounded-2xl p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-bold text-[#121511]">Profile Strength</p>
          <p className="text-[13px] font-black text-[#163300]">{completeness}%</p>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9FE870] rounded-full transition-all duration-700"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="text-[12px] text-[#6A6C6A] mt-2">
          {completeness < 60
            ? 'Add more details to get discovered by more brands'
            : completeness < 90
            ? 'Looking good! Add content samples to get even more enquiries'
            : 'Excellent! Your profile is fully optimised for discovery'}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#163300]/20 text-[15px] font-semibold text-[#163300] hover:border-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Launching your profile...</>
          ) : (
            'Go to my Dashboard →'
          )}
        </button>
      </div>
    </div>
  )
}

function maskHandle(handle: string): string {
  if (!handle || handle.length < 4) return handle
  return handle.slice(0, 2) + '_'.repeat(3) + handle.slice(-1)
}
