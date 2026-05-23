'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { CITIES, NICHES, PLATFORMS } from '@/lib/types'

const TOTAL = 4
const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'
const TEAM_SIZES = ['1–10', '11–50', '51–200', '200+']
const BRAND_TYPES = [
  { value: 'product', label: 'Product-based', emoji: '📦', desc: 'You sell physical or digital products' },
  { value: 'service', label: 'Service-based', emoji: '🛠️', desc: 'You offer services or subscriptions' },
]

export default function BrandOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    brand_name: '', website_url: '',
    type: '' as 'product' | 'service' | '',
    niche: '', description: '', city: '', team_size: '',
    instagram_url: '', youtube_url: '',
    platforms: [] as string[],
  })

  function set<K extends keyof typeof data>(k: K, v: typeof data[K]) { setData(p => ({ ...p, [k]: v })) }
  function togglePlatform(v: string) {
    setData(p => ({ ...p, platforms: p.platforms.includes(v) ? p.platforms.filter(x => x !== v) : [...p.platforms, v] }))
  }
  function next() {
    if (step === 1 && !data.brand_name.trim()) { toast.error('Enter your brand name'); return }
    if (step < TOTAL) setStep(s => s + 1)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSaving(false); return }
    await supabase.from('users').upsert({ id: user.id, role: 'brand' })
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
      platforms: data.platforms.length ? data.platforms : null,
      onboarding_complete: true,
    })
    if (error) { toast.error('Failed to save. Please try again.'); setSaving(false); return }
    setStep(TOTAL)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="text-[18px] font-black text-[#163300]">GrabCollab</Link>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL - 1 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < step - 1 ? 'bg-[#163300]' : i === step - 1 ? 'bg-[#163300] w-8' : 'bg-[#E8E8E8]'} ${i === step - 1 ? 'w-8' : 'w-4'}`} />
          ))}
        </div>
        <span className="text-[13px] text-[#6A6C6A]">{step < TOTAL ? `Step ${step} of ${TOTAL - 1}` : 'Done!'}</span>
      </div>

      <div className="max-w-[600px] mx-auto px-5 py-10">
        {step === 1 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Tell us about your brand</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Basic info to get you started.</p>
            <div className="space-y-5 bg-white rounded-[24px] p-6">
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
                <select className={I} value={data.niche} onChange={e => set('niche', e.target.value)}>
                  <option value="">Select a category</option>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={L}>Brand Description</label>
                <textarea className={`${I} resize-none`} rows={3} maxLength={300} placeholder="What does your brand do? (300 chars max)" value={data.description} onChange={e => set('description', e.target.value)} />
                <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{data.description.length}/300</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={L}>City</label><select className={I} value={data.city} onChange={e => set('city', e.target.value)}><option value="">Select city</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className={L}>Team Size</label><select className={I} value={data.team_size} onChange={e => set('team_size', e.target.value)}><option value="">Select size</option>{TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-[32px] font-black text-[#121511] mb-1">Social presence</h1>
            <p className="text-[16px] text-[#6A6C6A] mb-8">Where can creators find you?</p>
            <div className="space-y-5 bg-white rounded-[24px] p-6">
              <div><label className={L}>Instagram URL</label><input className={I} placeholder="https://instagram.com/yourbrand" value={data.instagram_url} onChange={e => set('instagram_url', e.target.value)} /></div>
              <div><label className={L}>YouTube URL</label><input className={I} placeholder="https://youtube.com/@yourbrand" value={data.youtube_url} onChange={e => set('youtube_url', e.target.value)} /></div>
              <div>
                <label className={L}>Platforms you want creators for</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className={`px-4 py-2 rounded-full text-[14px] font-semibold border-2 transition-all ${data.platforms.includes(p) ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                      {p}
                    </button>
                  ))}
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
            <h1 className="text-[36px] font-black text-[#121511] mb-2">You're all set! 🎉</h1>
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
  )
}
