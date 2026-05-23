'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Check, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { CITIES, LANGUAGES, NICHES, NICHE_EMOJIS, PLATFORMS } from '@/lib/types'

const TOTAL = 5
const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const PRICE_GUIDE: [number, number, string][] = [
  [0, 10000, '₹1,000 – ₹5,000'],
  [10000, 50000, '₹5,000 – ₹15,000'],
  [50000, 100000, '₹15,000 – ₹35,000'],
  [100000, 500000, '₹35,000 – ₹1,00,000'],
  [500000, Infinity, '₹1,00,000+'],
]

function suggestPrice(followers: number): string {
  const row = PRICE_GUIDE.find(([lo, hi]) => followers >= lo && followers < hi)
  return row ? row[2] : '₹1,000 – ₹5,000'
}

const DEFAULT_PACKAGES = [
  { platform: 'Instagram', content_type: 'Reel', price_inr: 0, delivery_days: 7, revisions: 2, description: '', is_active: true },
  { platform: 'Instagram', content_type: 'Post', price_inr: 0, delivery_days: 5, revisions: 2, description: '', is_active: true },
  { platform: 'Instagram', content_type: 'Story', price_inr: 0, delivery_days: 3, revisions: 1, description: '', is_active: false },
]

export default function CreatorOnboarding() {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [data, setData] = useState({
    username: '', display_name: '', city: '', bio: '',
    languages: [] as string[],
    niches: [] as string[],
    instagram_url: '', instagram_followers: '',
    youtube_url: '', youtube_subscribers: '',
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

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSaving(false); return }
    await supabase.from('users').upsert({ id: user.id, role: 'creator' })

    const { data: profile, error } = await supabase.from('creator_profiles').insert({
      user_id: user.id,
      username: data.username || null,
      display_name: data.display_name || null,
      city: data.city || null,
      bio: data.bio || null,
      languages: data.languages.length ? data.languages : null,
      niches: data.niches.length ? data.niches : null,
      instagram_url: data.instagram_url || null,
      instagram_followers: data.instagram_followers ? parseInt(data.instagram_followers) : null,
      youtube_url: data.youtube_url || null,
      youtube_subscribers: data.youtube_subscribers ? parseInt(data.youtube_subscribers) : null,
      is_profile_live: true,
      onboarding_complete: true,
    }).select('id').single()

    if (error || !profile) { toast.error('Failed to save. Please try again.'); setSaving(false); return }

    const activePkgs = packages.filter(p => p.is_active && p.price_inr > 0)
    if (activePkgs.length) {
      await supabase.from('content_packages').insert(activePkgs.map(p => ({ ...p, creator_id: profile.id })))
    }
    setStep(TOTAL)
    setSaving(false)
  }

  function next() {
    if (step === 1 && usernameStatus === 'taken') { toast.error('Username is taken'); return }
    if (step === 2 && !data.display_name.trim()) { toast.error('Enter your display name'); return }
    setStep(s => s + 1)
  }

  const igFollowers = parseInt(data.instagram_followers) || 0
  const priceSuggestion = suggestPrice(igFollowers)

  return (
    <div className="min-h-screen bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="text-[18px] font-black text-[#163300]">GrabCollab</Link>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL - 1 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < step - 1 ? 'bg-[#163300] w-4' : i === step - 1 ? 'bg-[#163300] w-8' : 'bg-[#E8E8E8] w-4'}`} />
          ))}
        </div>
        <span className="text-[13px] text-[#6A6C6A]">{step < TOTAL ? `Step ${step} of ${TOTAL - 1}` : 'Done!'}</span>
      </div>

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
              <div><label className={L}>Display Name *</label><input className={I} placeholder="How you want to appear to brands" value={data.display_name} onChange={e => set('display_name', e.target.value)} /></div>
              <div><label className={L}>City</label><select className={I} value={data.city} onChange={e => set('city', e.target.value)}><option value="">Select city</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
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

        {/* STEP 3 — Content */}
        {step === 3 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Your content</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">What do you create, and where?</p>
            <div className="space-y-6 bg-white rounded-[24px] p-6">
              <div>
                <label className={L}>Your Niche (select all that apply)</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {NICHES.filter(n => n !== 'Other').map(n => (
                    <button key={n} onClick={() => toggleArr('niches', n)}
                      className={`p-2.5 rounded-[14px] border-2 text-center transition-all ${data.niches.includes(n) ? 'border-[#163300] bg-[#163300]/5' : 'border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                      <div className="text-[18px] mb-1">{NICHE_EMOJIS[n]}</div>
                      <p className="text-[11px] font-semibold text-[#121511] leading-tight">{n}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={L}>Instagram</label>
                <div className="grid grid-cols-2 gap-3">
                  <input className={I} placeholder="https://instagram.com/you" value={data.instagram_url} onChange={e => set('instagram_url', e.target.value)} />
                  <input className={I} type="number" placeholder="Follower count" value={data.instagram_followers} onChange={e => set('instagram_followers', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={L}>YouTube</label>
                <div className="grid grid-cols-2 gap-3">
                  <input className={I} placeholder="https://youtube.com/@you" value={data.youtube_url} onChange={e => set('youtube_url', e.target.value)} />
                  <input className={I} type="number" placeholder="Subscriber count" value={data.youtube_subscribers} onChange={e => set('youtube_subscribers', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Packages */}
        {step === 4 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Your packages</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-2">Set prices for your content. Brands will see these on your profile.</p>
            {igFollowers > 0 && (
              <div className="bg-[#163300]/5 border border-[#163300]/20 rounded-[14px] px-4 py-3 mb-6 text-[14px] text-[#163300]">
                💡 Based on your {igFollowers.toLocaleString('en-IN')} followers, creators like you typically charge <strong>{priceSuggestion}</strong> per post.
              </div>
            )}
            <div className="space-y-4">
              {packages.map((pkg, i) => (
                <div key={i} className={`bg-white rounded-[20px] p-5 border-2 transition-all ${pkg.is_active ? 'border-[#163300]/20' : 'border-[#E8E8E8] opacity-60'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[16px] font-black text-[#121511]">{pkg.platform} {pkg.content_type}</p>
                    </div>
                    <button onClick={() => setPackages(prev => prev.map((p, j) => j === i ? { ...p, is_active: !p.is_active } : p))}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold border transition-all ${pkg.is_active ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-[#E8E8E8] text-[#6A6C6A] border-[#E8E8E8]'}`}>
                      {pkg.is_active ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  {pkg.is_active && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={L}>Price (₹)</label>
                        <input type="number" className={I} placeholder="5000" value={pkg.price_inr || ''} onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, price_inr: parseInt(e.target.value) || 0 } : p))} />
                      </div>
                      <div>
                        <label className={L}>Delivery Days</label>
                        <input type="number" className={I} value={pkg.delivery_days} onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, delivery_days: parseInt(e.target.value) || 1 } : p))} />
                      </div>
                      <div>
                        <label className={L}>Revisions</label>
                        <input type="number" className={I} value={pkg.revisions} onChange={e => setPackages(prev => prev.map((p, j) => j === i ? { ...p, revisions: parseInt(e.target.value) || 0 } : p))} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — Done */}
        {step === 5 && (
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
            {step < 4
              ? <button onClick={next} className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors">Continue →</button>
              : <button onClick={save} disabled={saving} className="bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Go Live! 🚀'}
                </button>}
          </div>
        )}
      </div>
    </div>
  )
}
