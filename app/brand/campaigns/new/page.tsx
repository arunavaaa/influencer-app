'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { NICHES, PLATFORMS, getFormatsForPlatforms } from '@/lib/types'
import Link from 'next/link'

const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const CHIP_ON  = 'bg-[#163300] text-[#9FE870] border-[#163300]'
const CHIP_OFF = 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'

export default function NewCampaign() {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    title: '', goal: '',
    deliverable_formats: [] as string[],
    platforms: [] as string[],
    niches: [] as string[],
    budget_inr: '',
    application_deadline: '',
    content_deadline: '',
  })
  const [otherPlatform, setOtherPlatform] = useState('')
  const [otherNiche, setOtherNiche] = useState('')

  // Platform-aware toggle: removing a platform also removes its exclusive formats
  function togglePlatform(p: string) {
    const willRemove = data.platforms.includes(p)
    if (willRemove && p === 'Other') setOtherPlatform('')
    const newPlatforms = willRemove ? data.platforms.filter(x => x !== p) : [...data.platforms, p]
    const available = getFormatsForPlatforms(newPlatforms)
    setData(prev => ({
      ...prev,
      platforms: newPlatforms,
      deliverable_formats: prev.deliverable_formats.filter(f => available.includes(f)),
    }))
  }

  function toggleArr(k: 'deliverable_formats' | 'niches', v: string) {
    if (k === 'niches' && v === 'Other' && data.niches.includes('Other')) setOtherNiche('')
    setData(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }))
  }

  function resolveOther(arr: string[], other: string) {
    if (!arr.includes('Other')) return arr
    const base = arr.filter(v => v !== 'Other')
    return other.trim() ? [...base, other.trim()] : [...base, 'Other']
  }

  async function submit(status: 'draft' | 'open') {
    if (!data.title.trim()) { toast.error('Enter a campaign title'); return }
    if (status === 'open' && !data.goal.trim()) { toast.error('Describe the campaign goal before publishing'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSaving(false); return }
    const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!brand) { toast.error('Brand profile not found'); setSaving(false); return }

    const { data: campaign, error } = await supabase.from('campaigns').insert({
      brand_id: brand.id,
      title: data.title,
      goal: data.goal,
      deliverable_formats: data.deliverable_formats.length ? data.deliverable_formats : null,
      platforms: data.platforms.length ? resolveOther(data.platforms, otherPlatform) : null,
      niches: data.niches.length ? resolveOther(data.niches, otherNiche) : null,
      budget_inr: data.budget_inr ? parseInt(data.budget_inr) : null,
      application_deadline: data.application_deadline || null,
      content_deadline: data.content_deadline || null,
      status,
    }).select('id').single()

    if (error) { toast.error('Failed to save campaign'); setSaving(false); return }
    toast.success(status === 'open' ? 'Campaign published!' : 'Saved as draft')
    router.push(`/brand/campaigns/${campaign.id}`)
  }

  const availableFormats = getFormatsForPlatforms(data.platforms)

  return (
    <div className="p-6 md:p-8 max-w-[720px]">
      <Link href="/brand/campaigns" className="flex items-center gap-1.5 text-[13px] text-[#6A6C6A] hover:text-[#163300] mb-5 transition-colors w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> My Campaigns
      </Link>
      <h1 className="text-[28px] font-black text-[#121511] mb-1">Post a Campaign</h1>
      <p className="text-[15px] text-[#6A6C6A] mb-8">Tell creators what you need. The more detail, the better applications you'll get.</p>

      <div className="space-y-6">
        {/* Title + goal */}
        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <div>
            <label className={L}>Campaign Title *</label>
            <input className={I} placeholder="e.g. Reel for our new skincare launch" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className={L}>Goal / Description *</label>
            <textarea className={`${I} resize-none`} rows={4} placeholder="What do you want creators to do? What message should they convey? Any do's and don'ts?" value={data.goal} onChange={e => setData(p => ({ ...p, goal: e.target.value }))} />
          </div>
        </div>

        {/* Platform + deliverable format + niche */}
        <div className="bg-white rounded-[24px] p-6 space-y-6">

          {/* Platform — always visible */}
          <div>
            <label className={L}>Platform</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${data.platforms.includes(p) ? CHIP_ON : CHIP_OFF}`}>
                  {p}
                </button>
              ))}
            </div>
            {data.platforms.includes('Other') && (
              <input className={`${I} mt-3`} placeholder="e.g. Snapchat, Pinterest, X…" value={otherPlatform} onChange={e => setOtherPlatform(e.target.value)} autoFocus />
            )}
          </div>

          {/* Deliverable format — only shown once platform(s) selected */}
          {data.platforms.length > 0 && (
            <div>
              <label className={L}>Deliverable Format</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableFormats.map(f => (
                  <button key={f} type="button" onClick={() => toggleArr('deliverable_formats', f)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${data.deliverable_formats.includes(f) ? CHIP_ON : CHIP_OFF}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Creator niche */}
          <div>
            <label className={L}>Creator Niche</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {NICHES.filter(n => n !== 'Other').map(n => (
                <button key={n} type="button" onClick={() => toggleArr('niches', n)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${data.niches.includes(n) ? CHIP_ON : CHIP_OFF}`}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => toggleArr('niches', 'Other')}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${data.niches.includes('Other') ? CHIP_ON : CHIP_OFF}`}>
                Other
              </button>
            </div>
            {data.niches.includes('Other') && (
              <input className={`${I} mt-3`} placeholder="e.g. Astrology, Pets, LGBTQ+…" value={otherNiche} onChange={e => setOtherNiche(e.target.value)} autoFocus />
            )}
          </div>
        </div>

        {/* Budget + deadlines */}
        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <div>
            <label className={L}>Budget (₹) — Optional</label>
            <input className={I} type="number" placeholder="e.g. 10000" value={data.budget_inr} onChange={e => setData(p => ({ ...p, budget_inr: e.target.value }))} />
            <p className="text-[12px] text-[#9A9C9A] mt-1">Leave blank if you prefer to discuss with applicants.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={L}>Apply by</label>
              <input type="date" className={I} value={data.application_deadline} onChange={e => {
                const val = e.target.value
                setData(p => ({
                  ...p,
                  application_deadline: val,
                  content_deadline: p.content_deadline && val && p.content_deadline <= val ? '' : p.content_deadline,
                }))
              }} />
            </div>
            <div>
              <label className={L}>Deliver by</label>
              <input type="date" className={I} value={data.content_deadline} onChange={e => {
                const val = e.target.value
                if (data.application_deadline && val && val <= data.application_deadline) {
                  toast.error('Content deadline must be after the application deadline')
                  return
                }
                setData(p => ({ ...p, content_deadline: val }))
              }} />
            </div>
          </div>
        </div>
      </div>
      <div className="h-20" />

      <div className="fixed bottom-0 left-[220px] right-0 bg-[#EDEFEB] py-4 z-10">
        <div className="flex gap-3 max-w-[720px] px-8">
          <button onClick={() => submit('draft')} disabled={saving} className="px-6 py-3 border-2 border-[#163300]/30 rounded-full text-[14px] font-bold text-[#163300] hover:border-[#163300] transition-colors disabled:opacity-60">
            Save as Draft
          </button>
          <button onClick={() => submit('open')} disabled={saving} className="flex-1 bg-[#163300] text-[#9FE870] font-bold text-[15px] py-3 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Publish Campaign →'}
          </button>
        </div>
      </div>
    </div>
  )
}
