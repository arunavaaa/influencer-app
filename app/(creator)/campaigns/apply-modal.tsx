'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Campaign {
  title: string
  goal: string | null
  platforms: string[] | null
  deliverable_formats: string[] | null
  niches: string[] | null
  budget_inr: number | null
  application_deadline: string | null
  content_deadline: string | null
  brand_name: string | null
}

export function ApplyModal({ campaignId, creatorId, campaign }: {
  campaignId: string
  creatorId: string
  campaign: Campaign
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [rate, setRate] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (coverNote.trim().length < 50) { toast.error('Cover note must be at least 50 characters'); return }
    setLoading(true)
    const { error } = await supabase.from('applications').insert({
      campaign_id: campaignId, creator_id: creatorId,
      cover_note: coverNote.trim(),
      proposed_rate_inr: rate ? parseInt(rate) : null,
      status: 'pending',
    })
    if (error) { toast.error('Failed to apply. You may have already applied.'); setLoading(false); return }
    toast.success('Application submitted! 🎉')
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
  const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

  function fmtDate(d: string | null) {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full py-2.5 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">
        View & Apply →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[560px] shadow-xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F0F0F0] flex-shrink-0">
              <h3 className="text-[18px] font-black text-[#121511]">Apply to Campaign</h3>
              <button onClick={() => setOpen(false)} className="text-[#9A9C9A] hover:text-[#121511]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* ── Campaign details ── */}
              <div className="bg-[#EDEFEB] rounded-[18px] p-4 space-y-3">
                <div>
                  {campaign.brand_name && <p className="text-[11px] font-bold text-[#6A6C6A] mb-0.5">{campaign.brand_name}</p>}
                  <p className="text-[16px] font-black text-[#121511]">{campaign.title}</p>
                </div>

                {campaign.goal && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-1">What the brand needs</p>
                    <p className="text-[13px] text-[#4A4C4A] leading-relaxed whitespace-pre-wrap">{campaign.goal}</p>
                  </div>
                )}

                {/* Tags */}
                {((campaign.platforms?.length ?? 0) > 0 || (campaign.deliverable_formats?.length ?? 0) > 0 || (campaign.niches?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.platforms?.map(p => <span key={p} className="text-[11px] px-2 py-0.5 bg-white text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                    {campaign.deliverable_formats?.map(f => <span key={f} className="text-[11px] px-2 py-0.5 bg-[#F5F0FF] text-purple-700 rounded-full font-semibold">{f}</span>)}
                    {campaign.niches?.map(n => <span key={n} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">{n}</span>)}
                  </div>
                )}

                {/* Budget + deadlines */}
                <div className="flex flex-wrap gap-4 pt-1 border-t border-[#D8DAD6]">
                  {campaign.budget_inr
                    ? <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A]">Budget</p><p className="text-[13px] font-bold text-[#163300]">₹{campaign.budget_inr.toLocaleString('en-IN')}</p></div>
                    : <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A]">Budget</p><p className="text-[13px] font-semibold text-[#9A9C9A]">To be discussed</p></div>}
                  {campaign.application_deadline && (
                    <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A]">Apply by</p><p className="text-[13px] font-bold text-[#4A4C4A]">{fmtDate(campaign.application_deadline)}</p></div>
                  )}
                  {campaign.content_deadline && (
                    <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A]">Deliver by</p><p className="text-[13px] font-bold text-[#4A4C4A]">{fmtDate(campaign.content_deadline)}</p></div>
                  )}
                </div>
              </div>

              {/* ── Application form ── */}
              <div className="space-y-4">
                <div>
                  <label className={L}>Cover Note *</label>
                  <textarea
                    rows={4} maxLength={500} value={coverNote} onChange={e => setCoverNote(e.target.value)}
                    placeholder="Tell the brand why you're a great fit. What's your audience like? How would you approach this campaign? (50–500 chars)"
                    className={`${I} resize-none`}
                  />
                  <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{coverNote.length}/500</p>
                </div>
                <div>
                  <label className={L}>Your Rate (₹) — Optional</label>
                  <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="Leave blank to discuss"
                    className={I} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-[#F0F0F0] flex-shrink-0">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-semibold text-[#6A6C6A] hover:border-[#163300]/40 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={loading}
                className="flex-1 py-3 bg-[#163300] text-[#9FE870] font-bold text-[14px] rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application →'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
