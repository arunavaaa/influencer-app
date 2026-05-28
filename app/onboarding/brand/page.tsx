'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Check, Plus, X, Camera, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { CITIES, NICHES } from '@/lib/types'
import { AppSelect } from '@/components/ui/app-select'

const EXTRA_SOCIALS = [
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/yourbrand', emoji: '📘' },
  { key: 'x_url',        label: 'X',        placeholder: 'https://x.com/yourbrand',         emoji: '𝕏' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourbrand', emoji: '💼' },
] as const

const TOTAL = 4
const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'
const TEAM_SIZES = ['1–10', '11–50', '51–200', '200+']
const BRAND_TYPES = [
  { value: 'product', label: 'Product-based', emoji: '📦', desc: 'You sell physical or digital products' },
  { value: 'service', label: 'Service-based', emoji: '🛠️', desc: 'You offer services or subscriptions' },
]

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function BrandOnboarding() {
  const router = useRouter()
  const supabase = createClient()

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

  // Onboarding state
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    brand_name: '', website_url: '',
    type: '' as 'product' | 'service' | '',
    niche: '', description: '', city: '', team_size: '',
    instagram_url: '', youtube_url: '',
    facebook_url: '', x_url: '', linkedin_url: '',
  })
  const [extraSocialsOpen, setExtraSocialsOpen] = useState<Record<string, boolean>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user)
      setAuthChecked(true)
    })
  }, [])

  async function signUpWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=brand` },
    })
    if (error) toast.error(error.message)
  }

  async function signUpWithEmail() {
    if (!acName.trim()) { toast.error('Enter your brand name'); return }
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
    await supabase.from('users').insert({ id: authData.user.id, role: 'brand' })
    setAuthed(true)
    setAcLoading(false)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Unsupported format — please upload a JPG or PNG file.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image too large — max size is 2 MB. Please compress and try again.'); return }
    const previewUrl = URL.createObjectURL(file)
    const img = new window.Image()
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = previewUrl })
    if (img.width < 200 || img.height < 200) { URL.revokeObjectURL(previewUrl); toast.error(`Image too small — minimum 200×200px required (yours is ${img.width}×${img.height}px).`); return }
    setLogoFile(file)
    setLogoPreview(previewUrl)
  }

  function set<K extends keyof typeof data>(k: K, v: typeof data[K]) { setData(p => ({ ...p, [k]: v })) }
  function next() {
    if (step === 1 && !data.brand_name.trim()) { toast.error('Enter your brand name'); return }
    if (step < TOTAL) setStep(s => s + 1)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSaving(false); return }
    await supabase.from('users').upsert({ id: user.id, role: 'brand' })
    const otherLinks: Record<string, string> = {}
    if (data.facebook_url) otherLinks.facebook_url = data.facebook_url
    if (data.x_url) otherLinks.x_url = data.x_url
    if (data.linkedin_url) otherLinks.linkedin_url = data.linkedin_url

    let logo_url: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const { error: uploadError } = await supabase.storage.from('brand-logos').upload(`${user.id}/logo.${ext}`, logoFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('brand-logos').getPublicUrl(`${user.id}/logo.${ext}`)
        logo_url = publicUrl
      }
    }

    const { error } = await supabase.from('brand_profiles').insert({
      user_id: user.id,
      brand_name: data.brand_name,
      website_url: data.website_url || null,
      type: data.type || null,
      niche: data.niche || null,
      description: data.description || null,
      city: data.city || null,
      team_size: data.team_size || null,
      instagram_url: data.instagram_url || null,
      youtube_url: data.youtube_url || null,
      other_social_links: Object.keys(otherLinks).length ? otherLinks : null,
      logo_url,
      onboarding_complete: true,
    })
    if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
    setStep(TOTAL)
    setSaving(false)
  }

  if (!authChecked) {
    return (
      <div className="h-screen -mt-16 flex flex-col bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-10 py-4 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="text-[18px] font-black text-[#163300]">GrabCollab</Link>
          <span className="text-[13px] text-[#6A6C6A]">Join as Brand</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#163300]" />
        </div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="h-screen -mt-16 flex flex-col bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-10 py-4 flex items-center justify-between flex-shrink-0">
          <Link href="/" className="text-[18px] font-black text-[#163300]">GrabCollab</Link>
          <span className="text-[13px] text-[#6A6C6A]">Create Account</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] mx-auto px-5 py-10">
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Create your brand account</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Start hiring creators for your next campaign.</p>
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
                <label className={L}>Brand Name</label>
                <input className={I} placeholder="Your brand name" value={acName} onChange={e => setAcName(e.target.value)} />
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
        <Link href="/" className="text-[18px] font-black text-[#163300]">GrabCollab</Link>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL - 1 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < step - 1 ? 'bg-[#163300] w-4' : i === step - 1 ? 'bg-[#163300] w-8' : 'bg-[#E8E8E8] w-4'}`} />
          ))}
        </div>
        <span className="text-[13px] text-[#6A6C6A]">{step < TOTAL ? `Step ${step} of ${TOTAL - 1}` : 'Done!'}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-[600px] mx-auto px-5 py-10">
        {step === 1 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Tell us about your brand</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Basic info to get you started.</p>
            <div className="space-y-5 bg-white rounded-[24px] p-6">
              <div className="flex flex-col items-center">
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <label htmlFor="logo-upload" className="cursor-pointer group relative">
                  <div className="w-20 h-20 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[28px] overflow-hidden">
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      : <span>{data.brand_name?.[0]?.toUpperCase() || 'B'}</span>}
                    <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#163300] rounded-full flex items-center justify-center border-2 border-white">
                    <Camera className="w-3 h-3 text-[#9FE870]" />
                  </div>
                </label>
                <p className="text-[12px] text-[#6A6C6A] mt-2">{logoPreview ? 'Logo added ✓' : 'Upload brand logo'}</p>
                <p className="text-[11px] text-[#9A9C9A] mt-0.5">Min 200×200px · JPG or PNG · Max 2 MB</p>
              </div>
              <div><label className={L}>Brand Name *</label><input className={I} placeholder="Your brand name" value={data.brand_name} onChange={e => set('brand_name', e.target.value)} /></div>
              <div><label className={L}>Website URL</label><input className={I} placeholder="https://yourbrand.com" value={data.website_url} onChange={e => set('website_url', e.target.value)} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">About your brand</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Help creators understand who you are.</p>
            <div className="space-y-5 bg-white rounded-[24px] p-6">
              <div>
                <label className={L}>Brand Type</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {BRAND_TYPES.map(t => (
                    <button key={t.value} onClick={() => set('type', t.value as 'product' | 'service')}
                      className={`p-4 rounded-[16px] border-2 text-left transition-all ${data.type === t.value ? 'border-[#163300] bg-[#163300]/5' : 'border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                      <div className="text-[20px] mb-1">{t.emoji}</div>
                      <p className="text-[14px] font-bold text-[#121511]">{t.label}</p>
                      <p className="text-[12px] text-[#6A6C6A]">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={L}>Niche / Category</label>
                <AppSelect className={I} value={data.niche} onChange={e => set('niche', e.target.value)}>
                  <option value="">Select a category</option>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </AppSelect>
              </div>
              <div>
                <label className={L}>Brand Description</label>
                <textarea className={`${I} resize-none`} rows={3} maxLength={300} placeholder="What does your brand do? (300 chars max)" value={data.description} onChange={e => set('description', e.target.value)} />
                <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{data.description.length}/300</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={L}>City</label><AppSelect className={I} value={data.city} onChange={e => set('city', e.target.value)}><option value="">Select city</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</AppSelect></div>
                <div><label className={L}>Team Size</label><AppSelect className={I} value={data.team_size} onChange={e => set('team_size', e.target.value)}><option value="">Select size</option>{TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</AppSelect></div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Social presence</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Where can creators find you?</p>
            <div className="space-y-5 bg-white rounded-[24px] p-6">
              <div>
                <label className={L}>Instagram URL</label>
                <input className={I} placeholder="https://instagram.com/yourbrand" value={data.instagram_url} onChange={e => set('instagram_url', e.target.value)} />
              </div>
              <div>
                <label className={L}>YouTube URL</label>
                <input className={I} placeholder="https://youtube.com/@yourbrand" value={data.youtube_url} onChange={e => set('youtube_url', e.target.value)} />
              </div>
              <div>
                <label className={L}>More social links</label>
                <div className="flex flex-wrap gap-2 mt-2 mb-3">
                  {EXTRA_SOCIALS.map(({ key, label }) => {
                    const isOpen = extraSocialsOpen[key]
                    return (
                      <button key={key} type="button"
                        onClick={() => {
                          if (isOpen) set(key as keyof typeof data, '' as any)
                          setExtraSocialsOpen(p => ({ ...p, [key]: !isOpen }))
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all ${isOpen ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                        {isOpen ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {label}
                      </button>
                    )
                  })}
                </div>
                <div className="space-y-3">
                  {EXTRA_SOCIALS.map(({ key, placeholder, emoji }) =>
                    extraSocialsOpen[key] ? (
                      <div key={key} className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px]">{emoji}</span>
                        <input className={`${I} pl-9`} placeholder={placeholder}
                          value={(data as any)[key]} onChange={e => set(key as keyof typeof data, e.target.value as any)} />
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-[#9FE870] rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#163300]" strokeWidth={3} />
            </div>
            <h1 className="text-[36px] font-black text-[#121511] mb-2">You&apos;re all set! 🎉</h1>
            <p className="text-[17px] text-[#6A6C6A] mb-10 max-w-[380px] mx-auto">Your brand profile is live. Post your first campaign to start receiving applications from creators.</p>
            <div className="bg-white rounded-[24px] p-6 text-left mb-8 max-w-[340px] mx-auto">
              <div className="w-14 h-14 bg-[#163300] rounded-[16px] flex items-center justify-center text-[#9FE870] font-black text-[22px] mb-3">
                {data.brand_name[0]?.toUpperCase()}
              </div>
              <p className="text-[18px] font-black text-[#121511]">{data.brand_name}</p>
              {data.niche && <p className="text-[14px] text-[#6A6C6A]">{data.niche}</p>}
              {data.city && <p className="text-[13px] text-[#9A9C9A]">{data.city}</p>}
            </div>
            <div className="flex flex-col gap-3 items-center">
              <Link href="/brand/campaigns/new" className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 px-10 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">
                Post Your First Campaign →
              </Link>
              <Link href="/brand/dashboard" className="text-[15px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors">
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
            {step < 3
              ? <button onClick={next} className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors">Continue →</button>
              : <button onClick={save} disabled={saving} className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Finish Setup →'}
                </button>}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
