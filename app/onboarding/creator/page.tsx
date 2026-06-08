'use client'

import { useState, useEffect, useRef } from 'react'
import { OnboardingFeedbackPrompt } from '@/components/ui/onboarding-feedback-prompt'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Check, Copy, Trash2, Eye, EyeOff, Camera } from 'lucide-react'
import Link from 'next/link'
import { CITIES, LANGUAGES, NICHES, NICHE_EMOJIS, FOLLOWER_RANGES } from '@/lib/types'
import { AppSelect } from '@/components/ui/app-select'

const TOTAL = 6
const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const PACKAGE_PLATFORMS = ['Instagram', 'YouTube', 'X', 'Facebook']

const CONTENT_TYPES_BY_PLATFORM: Record<string, string[]> = {
  Instagram: ['Reel', 'Story', 'Post'],
  YouTube:   ['Long form video', 'Shorts'],
  Facebook:  ['Reel', 'Post'],
  X:         ['Tweet (photo)', 'Tweet (video)', 'Thread'],
}

const BLANK_PACKAGE = { platform: '', content_type: '', price_inr: 0, delivery_days: 7, revisions: 1 }
const DEFAULT_PACKAGES = [{ ...BLANK_PACKAGE }]

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function CreatorOnboarding() {
  const supabase = createClient()
  const router = useRouter()

  // Auth state
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [acName, setAcName] = useState('')
  const [acEmail, setAcEmail] = useState('')
  const [acPassword, setAcPassword] = useState('')
  const [acConfirmPw, setAcConfirmPw] = useState('')
  const [acShowPw, setAcShowPw] = useState(false)
  const [acShowConfirmPw, setAcShowConfirmPw] = useState(false)
  const [acAgreed, setAcAgreed] = useState(false)
  const [acLoading, setAcLoading] = useState(false)

  const [step, setStep] = useState(1)
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)

  // Show onboarding feedback prompt 1.5s after reaching the success step
  useEffect(() => {
    if (step !== TOTAL) return
    const t = setTimeout(() => setShowFeedbackPrompt(true), 1500)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user)
      setAuthChecked(true)
    })
  }, [])

  async function signUpWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=creator` },
    })
    if (error) toast.error(error.message)
  }

  async function signUpWithEmail() {
    if (!acName.trim()) { toast.error('Enter your name'); return }
    if (!acEmail.trim()) { toast.error('Enter your email'); return }
    if (acPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (acPassword !== acConfirmPw) { toast.error('Passwords do not match'); return }
    if (!acAgreed) { toast.error('Please accept the terms to continue'); return }
    setAcLoading(true)
    const { data: authData, error } = await supabase.auth.signUp({
      email: acEmail, password: acPassword,
      options: { data: { full_name: acName } },
    })
    if (error) { toast.error(error.message); setAcLoading(false); return }
    if (!authData.user) { toast.error('Signup failed'); setAcLoading(false); return }
    if (!authData.session) {
      toast.info('We sent a verification email to ' + acEmail + '. Please verify your email then sign in to continue setting up your profile.')
      setAcLoading(false)
      return
    }
    await fetch('/api/set-role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'creator' }) })
    setAuthed(true)
    setAcLoading(false)
  }

  const [saving, setSaving] = useState(false)
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [socialsOpen, setSocialsOpen] = useState({ x: false, facebook: false })

  function toggleSocial(key: 'x' | 'facebook') {
    if (socialsOpen[key]) {
      if (key === 'x') { set('x_url', ''); set('x_followers', '') }
      else if (key === 'facebook') { set('facebook_url', ''); set('facebook_followers', '') }
    }
    setSocialsOpen(v => ({ ...v, [key]: !v[key] }))
  }
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [data, setData] = useState({
    username: '', display_name: '', city: '', bio: '',
    languages: [] as string[],
    niches: [] as string[],
    other_niche: '',
    instagram_url: '', instagram_followers: '',
    youtube_url: '', youtube_subscribers: '',
    x_url: '', x_followers: '',
    facebook_url: '', facebook_followers: '',
  })
  const [packages, setPackages] = useState(DEFAULT_PACKAGES.map(p => ({ ...p })))

  function set<K extends keyof typeof data>(k: K, v: typeof data[K]) { setData(p => ({ ...p, [k]: v })) }
  function toggleArr<K extends 'languages' | 'niches'>(k: K, v: string) {
    setData(p => ({ ...p, [k]: (p[k] as string[]).includes(v) ? (p[k] as string[]).filter(x => x !== v) : [...(p[k] as string[]), v] }))
  }

  function checkUsername(val: string) {
    const slug = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    set('username', slug)
    if (!slug) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      const { data: existing } = await supabase.from('creator_profiles').select('id').eq('username', slug).maybeSingle()
      setUsernameStatus(existing ? 'taken' : 'available')
    }, 500)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Unsupported format — please upload a JPG or PNG file.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image too large — max size is 2 MB. Please compress and try again.'); return }
    const previewUrl = URL.createObjectURL(file)
    const img = new window.Image()
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = previewUrl })
    if (img.width < 200 || img.height < 200) { URL.revokeObjectURL(previewUrl); toast.error(`Image too small — minimum 200×200px required (yours is ${img.width}×${img.height}px).`); return }
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
  }

  async function autoSave() {
    if (savedProfileId) return
    const mandatoryReady = data.username && data.display_name && data.niches.length > 0 &&
      ((data.instagram_url && data.instagram_followers) ||
       (data.youtube_url && data.youtube_subscribers) ||
       (socialsOpen.x && data.x_url && data.x_followers) ||
       (socialsOpen.facebook && data.facebook_url && data.facebook_followers))
    if (!mandatoryReady) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await fetch('/api/set-role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'creator' }) })
    const { data: profile } = await supabase.from('creator_profiles').insert({
      user_id: user.id,
      username: data.username,
      display_name: data.display_name || null,
      city: data.city || null,
      bio: data.bio || null,
      languages: data.languages.length ? data.languages : null,
      niches: data.niches.length ? data.niches.map(n => n === 'Other' && data.other_niche.trim() ? data.other_niche.trim() : n) : null,
      instagram_url: data.instagram_url || null,
      instagram_followers: data.instagram_followers !== '' ? parseInt(data.instagram_followers) : null,
      youtube_url: data.youtube_url || null,
      youtube_subscribers: data.youtube_subscribers !== '' ? parseInt(data.youtube_subscribers) : null,
      other_social_links: (() => {
        const links: Record<string, string> = {}
        if (data.x_url) links.x_url = data.x_url
        if (data.x_followers) links.x_followers = data.x_followers
        if (data.facebook_url) links.facebook_url = data.facebook_url
        if (data.facebook_followers) links.facebook_followers = data.facebook_followers
        return Object.keys(links).length ? links : null
      })(),
      is_profile_live: false,
      onboarding_complete: false,
    }).select('id').single()
    if (profile) setSavedProfileId(profile.id)
  }

  async function save(skipPackages = false) {
    if (!skipPackages) {
      const validPkgs = packages.filter(p => p.platform && p.content_type && p.price_inr > 0)
      if (!validPkgs.length) { toast.error('Add at least one package with a platform, content type, and price'); return }
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      toast.error('Your session has expired. Please sign in and try again.', {
        action: { label: 'Sign in', onClick: () => router.push('/login') },
      })
      return
    }
    await fetch('/api/set-role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'creator' }) })

    let avatar_url: string | null = null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const { error: uploadError } = await supabase.storage.from('creator-avatars').upload(`${user.id}/avatar.${ext}`, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('creator-avatars').getPublicUrl(`${user.id}/avatar.${ext}`)
        avatar_url = publicUrl
      }
    }

    const profileFields = {
      username: data.username || null,
      display_name: data.display_name || null,
      city: data.city || null,
      bio: data.bio || null,
      languages: data.languages.length ? data.languages : null,
      niches: data.niches.length ? data.niches.map(n => n === 'Other' && data.other_niche.trim() ? data.other_niche.trim() : n) : null,
      instagram_url: data.instagram_url || null,
      instagram_followers: data.instagram_followers !== '' ? parseInt(data.instagram_followers) : null,
      youtube_url: data.youtube_url || null,
      youtube_subscribers: data.youtube_subscribers !== '' ? parseInt(data.youtube_subscribers) : null,
      other_social_links: (() => {
        const links: Record<string, string> = {}
        if (data.x_url) links.x_url = data.x_url
        if (data.x_followers) links.x_followers = data.x_followers
        if (data.facebook_url) links.facebook_url = data.facebook_url
        if (data.facebook_followers) links.facebook_followers = data.facebook_followers
        return Object.keys(links).length ? links : null
      })(),
      ...(avatar_url ? { avatar_url } : {}),
      is_profile_live: true,
      onboarding_complete: true,
    }

    let profileId = savedProfileId
    if (savedProfileId) {
      const { error } = await supabase.from('creator_profiles').update(profileFields).eq('id', savedProfileId)
      if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
    } else {
      const { data: profile, error } = await supabase.from('creator_profiles').insert({ user_id: user.id, ...profileFields }).select('id').single()
      if (error || !profile) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
      profileId = profile.id
    }

    const activePkgs = skipPackages ? [] : packages.filter(p => p.platform && p.content_type && p.price_inr > 0)
    if (activePkgs.length && profileId) {
      await supabase.from('content_packages').insert(activePkgs.map(p => ({ ...p, creator_id: profileId })))
    }
    setStep(TOTAL)
    setSaving(false)
  }

  function next() {
    if (step === 1) {
      if (!data.username.trim()) { toast.error('Choose a username for your profile'); return }
      if (usernameStatus === 'taken') { toast.error('That username is taken — try another'); return }
      if (usernameStatus === 'checking') { toast.error('Checking username availability…'); return }
    }
    if (step === 2 && !data.display_name.trim()) { toast.error('Enter your display name'); return }
    if (step === 3 && !data.niches.length) { toast.error('Select at least one niche to continue'); return }
    if (step === 4) {
      if (data.instagram_url && !data.instagram_followers) { toast.error('Select your Instagram follower range'); return }
      if (data.instagram_followers && !data.instagram_url) { toast.error('Add your Instagram profile link'); return }
      if (data.youtube_url && !data.youtube_subscribers) { toast.error('Select your YouTube subscriber range'); return }
      if (data.youtube_subscribers && !data.youtube_url) { toast.error('Add your YouTube channel link'); return }
      if (socialsOpen.x) {
        if (data.x_url && !data.x_followers) { toast.error('Select your X follower range'); return }
        if (data.x_followers && !data.x_url) { toast.error('Add your X profile link'); return }
      }
      if (socialsOpen.facebook) {
        if (data.facebook_url && !data.facebook_followers) { toast.error('Select your Facebook follower range'); return }
        if (data.facebook_followers && !data.facebook_url) { toast.error('Add your Facebook profile link'); return }
      }
      const hasComplete = (data.instagram_url && data.instagram_followers) ||
        (data.youtube_url && data.youtube_subscribers) ||
        (socialsOpen.x && data.x_url && data.x_followers) ||
        (socialsOpen.facebook && data.facebook_url && data.facebook_followers)
      if (!hasComplete) { toast.error('Add at least one social profile with a link and follower range'); return }
      autoSave()
    }
    setStep(s => s + 1)
  }

  async function handleLogoExit() {
    await autoSave()
    router.push('/')
  }

  const header = (right: React.ReactNode) => (
    <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-10 py-4 flex items-center justify-between flex-shrink-0">
      <Link href="/" className="text-[18px] font-black text-[#163300]">GrabCollab</Link>
      {right}
    </div>
  )

  if (!authChecked) {
    return (
      <div className="h-screen -mt-16 flex flex-col bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        {header(<span className="text-[13px] text-[#6A6C6A]">Join as Creator</span>)}
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#163300]" />
        </div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="h-screen -mt-16 flex flex-col bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        {header(<span className="text-[13px] text-[#6A6C6A]">Create Account</span>)}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] mx-auto px-5 py-10">
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Create your creator account</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Start applying to brand campaigns for free.</p>
            <div className="bg-white rounded-[24px] p-6 space-y-5">
              <button onClick={signUpWithGoogle} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-[#163300]/20 text-[15px] font-semibold text-[#121511] hover:border-[#163300]/50 hover:bg-[#FAFAFA] transition-all">
                {GOOGLE_SVG}
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E8E8E8]" />
                <span className="text-[13px] text-[#B0B2AF]">or</span>
                <div className="flex-1 h-px bg-[#E8E8E8]" />
              </div>
              <div>
                <label className={L}>Full Name</label>
                <input className={I} placeholder="Your full name" value={acName} onChange={e => setAcName(e.target.value)} />
              </div>
              <div>
                <label className={L}>Email</label>
                <input type="email" className={I} placeholder="you@example.com" value={acEmail} onChange={e => setAcEmail(e.target.value)} />
              </div>
              <div>
                <label className={L}>Password</label>
                <div className="relative">
                  <input type={acShowPw ? 'text' : 'password'} className={`${I} pr-12`} placeholder="Min 8 characters"
                    value={acPassword} onChange={e => setAcPassword(e.target.value)} />
                  <button type="button" onClick={() => setAcShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9C9A] hover:text-[#163300] transition-colors">
                    {acShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={L}>Re-enter Password</label>
                <div className="relative">
                  <input type={acShowConfirmPw ? 'text' : 'password'} className={`${I} pr-12`} placeholder="Type your password again"
                    value={acConfirmPw} onChange={e => setAcConfirmPw(e.target.value)}
                    onPaste={e => e.preventDefault()}
                    onKeyDown={e => e.key === 'Enter' && signUpWithEmail()} />
                  <button type="button" onClick={() => setAcShowConfirmPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9C9A] hover:text-[#163300] transition-colors">
                    {acShowConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {acConfirmPw && acPassword !== acConfirmPw && (
                  <p className="text-[12px] text-red-500 mt-1.5 font-semibold">Passwords do not match</p>
                )}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acAgreed} onChange={e => setAcAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#163300] flex-shrink-0" />
                <span className="text-[13px] text-[#6A6C6A]">
                  I agree to the <Link href="/terms" className="text-[#163300] font-semibold hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#163300] font-semibold hover:underline">Privacy Policy</Link>
                </span>
              </label>
              <button onClick={signUpWithEmail} disabled={acLoading}
                className="w-full bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {acLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account →'}
              </button>
            </div>
            <p className="text-center text-[14px] text-[#6A6C6A] mt-6">
              Already have an account? <Link href="/login" className="text-[#163300] font-bold hover:underline">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen -mt-16 flex flex-col bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-10 py-4 flex items-center justify-between flex-shrink-0">
        <button onClick={handleLogoExit} className="text-[18px] font-black text-[#163300] hover:opacity-70 transition-opacity">GrabCollab</button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL - 1 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < step - 1 ? 'bg-[#163300] w-4' : i === step - 1 ? 'bg-[#163300] w-8' : 'bg-[#E8E8E8] w-4'}`} />
          ))}
        </div>
        <span className="text-[13px] text-[#6A6C6A]">{step < TOTAL ? `Step ${step} of ${TOTAL - 1}` : 'Done!'}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-[640px] mx-auto px-5 py-10">

        {/* STEP 1 — Username */}
        {step === 1 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Claim your profile</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Your unique URL on GrabCollab.</p>
            <div className="bg-white rounded-[24px] p-6">
              <label className={L}>Your Username</label>
              <div className="flex items-center rounded-2xl border border-[#163300]/20 overflow-hidden focus-within:border-[#163300] transition-colors">
                <span className="px-4 py-3 text-[15px] text-[#6A6C6A] bg-[#F5F5F5] border-r border-[#E8E8E8] flex-shrink-0">grabcollab.com/</span>
                <input
                  className="flex-1 px-4 py-3 text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none bg-white"
                  placeholder="yourname"
                  value={data.username}
                  onChange={e => checkUsername(e.target.value)}
                />
                <span className="px-3 flex-shrink-0 text-[20px]">
                  {usernameStatus === 'checking' ? '🔄' : usernameStatus === 'available' ? '✅' : usernameStatus === 'taken' ? '❌' : ''}
                </span>
              </div>
              {usernameStatus === 'available' && <p className="text-[13px] text-[#45A905] mt-2 font-semibold">grabcollab.com/{data.username} is available!</p>}
              {usernameStatus === 'taken' && <p className="text-[13px] text-red-500 mt-2">This username is taken. Try another.</p>}
            </div>
          </div>
        )}

        {/* STEP 2 — Your Details */}
        {step === 2 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Your details</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Tell brands who you are.</p>
            <div className="space-y-5 bg-white rounded-[24px] p-6">
              <div className="flex flex-col items-center">
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                  <div className="w-20 h-20 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[28px] overflow-hidden">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      : <span>{data.display_name?.[0]?.toUpperCase() || '?'}</span>}
                    <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#163300] rounded-full flex items-center justify-center border-2 border-white">
                    <Camera className="w-3 h-3 text-[#9FE870]" />
                  </div>
                </label>
                <p className="text-[12px] text-[#6A6C6A] mt-2">{avatarPreview ? 'Photo added ✓' : 'Upload profile photo'}</p>
                <p className="text-[11px] text-[#9A9C9A] mt-0.5">Min 200×200px · JPG or PNG · Max 2 MB</p>
              </div>
              <div><label className={L}>Display Name *</label><input className={I} placeholder="How you want to appear to brands" value={data.display_name} onChange={e => set('display_name', e.target.value)} /></div>
              <div><label className={L}>City</label><AppSelect className={I} value={data.city} onChange={e => set('city', e.target.value)}><option value="">Select city</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</AppSelect></div>
              <div>
                <label className={L}>Languages</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => toggleArr('languages', l)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all ${data.languages.includes(l) ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={L}>Bio</label>
                <textarea className={`${I} resize-none`} rows={3} maxLength={300} placeholder="Tell brands what you create (300 chars max)" value={data.bio} onChange={e => set('bio', e.target.value)} />
                <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{data.bio.length}/300</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Niche */}
        {step === 3 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Your niche</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">What kind of content do you create? Select all that apply.</p>
            <div className="bg-white rounded-[24px] p-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {NICHES.map(n => (
                  <button key={n} onClick={() => toggleArr('niches', n)}
                    className={`p-2.5 rounded-[14px] border-2 text-center transition-all ${data.niches.includes(n) ? 'border-[#163300] bg-[#163300]/5' : 'border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                    <div className="text-[18px] mb-1">{NICHE_EMOJIS[n]}</div>
                    <p className="text-[11px] font-semibold text-[#121511] leading-tight">{n}</p>
                  </button>
                ))}
              </div>
              {data.niches.includes('Other') && (
                <input className={`${I} mt-3`} placeholder="Describe your niche (e.g. Crypto, Astrology...)"
                  value={data.other_niche} onChange={e => set('other_niche', e.target.value)} autoFocus />
              )}
            </div>
          </div>
        )}

        {/* STEP 4 — Social Links */}
        {step === 4 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Your social links</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-4">Add your social profiles and choose the right follower range.</p>
            <div className="bg-[#163300]/5 border border-[#163300]/20 rounded-[16px] px-4 py-3 mb-6 text-[14px] text-[#163300] leading-relaxed">
              💡 <strong>Tip:</strong> Brands see your follower numbers directly on your profile. Choosing the accurate range builds trust and significantly increases your chances of getting selected for campaigns.
            </div>
            <div className="space-y-5 bg-white rounded-[24px] p-6">

              {/* Instagram */}
              <div>
                <label className={L}>Instagram</label>
                <div className="grid grid-cols-2 gap-3">
                  <input className={I} placeholder="https://instagram.com/you" value={data.instagram_url} onChange={e => set('instagram_url', e.target.value)} />
                  <AppSelect className={I} value={data.instagram_followers} onChange={e => set('instagram_followers', e.target.value)}>
                    <option value="">Followers</option>
                    {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                  </AppSelect>
                </div>
              </div>

              {/* YouTube */}
              <div>
                <label className={L}>YouTube</label>
                <div className="grid grid-cols-2 gap-3">
                  <input className={I} placeholder="https://youtube.com/@you" value={data.youtube_url} onChange={e => set('youtube_url', e.target.value)} />
                  <AppSelect className={I} value={data.youtube_subscribers} onChange={e => set('youtube_subscribers', e.target.value)}>
                    <option value="">Subscribers</option>
                    {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                  </AppSelect>
                </div>
              </div>

              {/* More social links */}
              <div>
                <label className={L}>More social links</label>
                <div className="flex flex-wrap gap-2 mt-1 mb-1">
                  {([
                    { key: 'x' as const,       label: 'X (Twitter)' },
                    { key: 'facebook' as const, label: 'Facebook' },
                  ]).map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => toggleSocial(key)}
                      className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${socialsOpen[key] ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {socialsOpen.x && (
                  <div className="mt-4">
                    <label className={L}>X (Twitter)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={I} placeholder="https://x.com/you" value={data.x_url} onChange={e => set('x_url', e.target.value)} />
                      <AppSelect className={I} value={data.x_followers} onChange={e => set('x_followers', e.target.value)}>
                        <option value="">Followers</option>
                        {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                      </AppSelect>
                    </div>
                  </div>
                )}

                {socialsOpen.facebook && (
                  <div className="mt-4">
                    <label className={L}>Facebook</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={I} placeholder="https://facebook.com/you" value={data.facebook_url} onChange={e => set('facebook_url', e.target.value)} />
                      <AppSelect className={I} value={data.facebook_followers} onChange={e => set('facebook_followers', e.target.value)}>
                        <option value="">Followers</option>
                        {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                      </AppSelect>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — Packages */}
        {step === 5 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Your packages</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-6">Set prices for your content. Brands will see these on your profile.</p>
            <div className="space-y-4">
              {packages.map((pkg, i) => (
                <div key={i} className="bg-white rounded-[20px] p-5 border border-[#E8E8E8]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[15px] font-black text-[#121511]">Package {i + 1}</p>
                    {i > 0 && (
                      <button onClick={() => setPackages(prev => prev.filter((_, j) => j !== i))}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={L}>Platform</label>
                        <AppSelect className={I} value={pkg.platform}
                          onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, platform: e.target.value, content_type: '' } : p))}>
                          <option value="">Select platform</option>
                          {PACKAGE_PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                        </AppSelect>
                      </div>
                      <div>
                        <label className={L}>Content Type</label>
                        <AppSelect className={I} value={pkg.content_type} disabled={!pkg.platform}
                          onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, content_type: e.target.value } : p))}>
                          <option value="">Select type</option>
                          {(CONTENT_TYPES_BY_PLATFORM[pkg.platform] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                        </AppSelect>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={L}>Price (₹)</label>
                        <input type="number" className={I} placeholder="5000" value={pkg.price_inr || ''}
                          onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, price_inr: parseInt(e.target.value) || 0 } : p))} />
                      </div>
                      <div>
                        <label className={L}>Delivery Days</label>
                        <input type="number" className={I} value={pkg.delivery_days}
                          onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, delivery_days: parseInt(e.target.value) || 1 } : p))} />
                      </div>
                      <div>
                        <label className={L}>Revisions</label>
                        <input type="number" className={I} value={pkg.revisions}
                          onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, revisions: parseInt(e.target.value) || 0 } : p))} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={() => setPackages(prev => [...prev, { ...BLANK_PACKAGE }])}
                className="w-full py-3.5 border-2 border-dashed border-[#163300]/30 rounded-[20px] text-[14px] font-bold text-[#163300] hover:border-[#163300] hover:bg-[#163300]/5 transition-all">
                + Add Package
              </button>
            </div>
          </div>
        )}

        {/* STEP 6 — Done */}
        {step === 6 && (
          <div className="text-center">
            <div className="text-[64px] mb-4">🎉</div>
            <h1 className="text-[36px] font-black text-[#121511] mb-2">You're live!</h1>
            <p className="text-[17px] text-[#6A6C6A] mb-8 max-w-[380px] mx-auto">Your creator profile is live on GrabCollab. Brands can now discover and contact you.</p>
            {data.username && (
              <div className="bg-white rounded-[20px] p-5 mb-8 max-w-[380px] mx-auto">
                <p className="text-[12px] font-bold uppercase tracking-widest text-[#6A6C6A] mb-2">Your Profile URL</p>
                <div className="flex items-center gap-2 bg-[#EDEFEB] rounded-[12px] px-4 py-3">
                  <span className="flex-1 text-[14px] font-semibold text-[#121511] truncate">grabcollab.com/{data.username}</span>
                  <button onClick={() => { navigator.clipboard.writeText(`https://grabcollab.com/${data.username}`); toast.success('Link copied!') }} className="text-[#163300] hover:opacity-70">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 items-center">
              <Link href="/campaigns" className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 px-10 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">
                Browse Campaigns →
              </Link>
              <Link href="/dashboard" className="text-[15px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {step < TOTAL && (
          <div className="mt-8 flex items-center justify-between">
            {step > 1
              ? <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-[15px] font-semibold text-[#6A6C6A] hover:text-[#121511] transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              : <div />}
            {step < 5
              ? <button onClick={next} className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors">Continue →</button>
              : <div className="flex items-center gap-6">
                  <button onClick={() => save(true)} disabled={saving} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors disabled:opacity-60">
                    I'll do it later
                  </button>
                  <button onClick={() => save()} disabled={saving} className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Go Live! 🚀'}
                  </button>
                </div>}
          </div>
        )}
      </div>
      </div>

      {showFeedbackPrompt && (
        <OnboardingFeedbackPrompt userRole="creator" onClose={() => setShowFeedbackPrompt(false)} />
      )}
    </div>
  )
}
