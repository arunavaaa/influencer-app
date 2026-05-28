'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { NICHES, PLATFORMS, getFormatsForPlatforms } from '@/lib/types'
import Link from 'next/link'

const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const CHIP_ON  = 'bg-[#163300] text-[#9FE870] border-[#163300]'
const CHIP_OFF = 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'

function mapArr(arr: string[] | null, known: string[]) {
  if (!arr?.length) return { selected: [] as string[], other: '' }
  const knownSet = new Set(known)
  const matched = arr.filter(v => knownSet.has(v))
  const custom = arr.filter(v => !knownSet.has(v))
  return custom.length
    ? { selected: [...matched, 'Other'], other: custom.join(', ') }
    : { selected: matched, other: '' }
}

export default function EditCampaign() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closing, setClosing] = useState(false)
  const [status, setStatus] = useState<'draft' | 'open' | 'closed'>('open')
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

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('campaigns').select('*').eq('id', id).single()
      if (!c) { router.push('/brand/campaigns'); return }
      setStatus(c.status)
      const knownPlatforms = PLATFORMS.filter(p => p !== 'Other')
      const knownNiches = NICHES.filter(n => n !== 'Other')
      const plats = mapArr(c.platforms, knownPlatforms)
      const niches = mapArr(c.niches, knownNiches)
      const savedFormats = (c.deliverable_formats ?? []) as string[]
      setData({
        title: c.title ?? '',
        goal: c.goal ?? '',
        deliverable_formats: savedFormats,
        platforms: plats.selected,
        niches: niches.selected,
        budget_inr: c.budget_inr ? String(c.budget_inr) : '',
        application_deadline: c.application_deadline ?? '',
        content_deadline: c.content_deadline ?? '',
      })
      setOtherPlatform(plats.other)
      setOtherNiche(niches.other)
      setLoading(false)
    }
    load()
  }, [id])

  // Platform-aware toggle: removing a platform strips its exclusive formats
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

  async function deleteCampaign() {
    setDeleting(true)
    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    if (error) { toast.error('Failed to delete campaign'); setDeleting(false); return }
    toast.success('Campaign deleted')
    router.push('/brand/campaigns')
  }

  async function closeCampaign() {
    setClosing(true)
    const { error } = await supabase.from('campaigns').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Failed to close campaign'); setClosing(false); return }
    toast.success('Campaign closed')
    router.push('/brand/campaigns?filter=closed')
  }

  async function save(overrideStatus?: 'draft' | 'open') {
    if (!data.title.trim()) { toast.error('Enter a campaign title'); return }
    if ((overrideStatus ?? status) === 'open' && !data.goal.trim()) { toast.error('Describe the campaign goal before publishing'); return }
    setSaving(true)
    const { error } = await supabase.from('campaigns').update({
      title: data.title,
      goal: data.goal,
      deliverable_formats: data.deliverable_formats.length ? data.deliverable_formats : null,
      platforms: data.platforms.length ? resolveOther(data.platforms, otherPlatform) : null,
      niches: data.niches.length ? resolveOther(data.niches, otherNiche) : null,
      budget_inr: data.budget_inr ? parseInt(data.budget_inr) : null,
      application_deadline: data.application_deadline || null,
      content_deadline: data.content_deadline || null,
      status: overrideStatus ?? status,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error('Failed to save changes'); setSaving(false); return }
    toast.success(overrideStatus === 'open' ? 'Campaign published!' : 'Changes saved')
    router.push(`/brand/campaigns/${id}`)
  }

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[200px]"><Loader2 className="w-6 h-6 animate-spin text-[#163300]" /></div>

  return (
    <div className="p-6 md:p-8 max-w-[720px]">
      <Link href="/brand/campaigns" className="flex items-center gap-1.5 text-[13px] text-[#6A6C6A] hover:text-[#163300] mb-5 transition-colors w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
      </Link>
      <h1 className="text-[28px] font-black text-[#121511] mb-1">Edit Campaign</h1>
      <p className="text-[15px] text-[#6A6C6A] mb-8">Changes are visible to creators immediately after saving.</p>

      <div className="space-y-6">
        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <div>
            <label className={L}>Campaign Title *</label>
            <input className={I} placeholder="e.g. Reel for our new skincare launch" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className={L}>Goal / Description *</label>
            <textarea className={`${I} resize-none`} rows={4} placeholder="What do you want creators to do?" value={data.goal} onChange={e => setData(p => ({ ...p, goal: e.target.value }))} />
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 space-y-6">
          {/* Platform — always visible first */}
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
              <input className={`${I} mt-3`} placeholder="e.g. Snapchat, Pinterest…" value={otherPlatform} onChange={e => setOtherPlatform(e.target.value)} />
            )}
          </div>

          {/* Deliverable format — only shown once platform(s) selected */}
          {data.platforms.length > 0 && (
            <div>
              <label className={L}>Deliverable Format</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {getFormatsForPlatforms(data.platforms).map(f => (
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
              <input className={`${I} mt-3`} placeholder="e.g. Astrology, Pets…" value={otherNiche} onChange={e => setOtherNiche(e.target.value)} />
            )}
          </div>
        </div>

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
          {status === 'draft' && (
            <button onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 border-2 border-[#163300]/30 rounded-full text-[14px] font-bold text-red-500 hover:border-[#163300]/50 transition-colors flex-shrink-0">
              Delete
            </button>
          )}
          {status === 'open' && (
            <button onClick={() => setShowCloseModal(true)}
              className="px-6 py-3 border-2 border-[#163300]/30 rounded-full text-[14px] font-bold text-[#163300] hover:border-[#163300] transition-colors flex-shrink-0">
              Close Campaign
            </button>
          )}
          {status === 'draft' && (
            <button onClick={() => save('draft')} disabled={saving}
              className="px-6 py-3 border-2 border-[#163300]/30 rounded-full text-[14px] font-bold text-[#163300] hover:border-[#163300] transition-colors disabled:opacity-60">
              Save as Draft
            </button>
          )}
          <button onClick={() => save(status === 'draft' ? 'open' : undefined)} disabled={saving}
            className="flex-1 bg-[#163300] text-[#9FE870] font-bold text-[15px] py-3 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : status === 'draft' ? 'Publish Campaign →' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal (draft only) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-[24px] p-6 w-full max-w-[400px] shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-[18px] font-black text-[#121511] mb-1">Delete this campaign?</h3>
            <p className="text-[14px] text-[#6A6C6A] mb-6">This will permanently delete the campaign and all its applications. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-bold text-[#4A4C4A] hover:border-[#163300]/30 transition-colors">
                Cancel
              </button>
              <button onClick={deleteCampaign} disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-full text-[14px] font-bold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close campaign confirmation modal (open only) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-white rounded-[24px] p-6 w-full max-w-[400px] shadow-2xl">
            <div className="w-12 h-12 bg-[#EDEFEB] rounded-full flex items-center justify-center mb-4">
              <span className="text-[22px]">🔒</span>
            </div>
            <h3 className="text-[18px] font-black text-[#121511] mb-1">Close this campaign?</h3>
            <p className="text-[14px] text-[#6A6C6A] mb-6">Closing this campaign means creators won't be able to see or apply to it anymore. Existing applications won't be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-bold text-[#4A4C4A] hover:border-[#163300]/30 transition-colors">
                Cancel
              </button>
              <button onClick={closeCampaign} disabled={closing}
                className="flex-1 py-3 bg-red-600 text-white rounded-full text-[14px] font-bold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {closing ? <><Loader2 className="w-4 h-4 animate-spin" /> Closing...</> : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
