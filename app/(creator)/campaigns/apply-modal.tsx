'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ApplyModal({ campaignId, creatorId, campaignTitle }: { campaignId: string; creatorId: string; campaignTitle: string }) {
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

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full py-2.5 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">
        Apply →
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-[24px] w-full max-w-[480px] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-black text-[#121511]">Apply to Campaign</h3>
              <button onClick={() => setOpen(false)} className="text-[#9A9C9A] hover:text-[#121511]"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-[14px] text-[#6A6C6A] mb-5 truncate font-semibold">{campaignTitle}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5">Cover Note *</label>
                <textarea
                  rows={4} maxLength={500} value={coverNote} onChange={e => setCoverNote(e.target.value)}
                  placeholder="Tell the brand why you're a great fit. What's your audience like? How would you approach this campaign? (50–500 chars)"
                  className="w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors resize-none"
                />
                <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{coverNote.length}/500</p>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5">Your Rate (₹) — Optional</label>
                <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="Leave blank to discuss"
                  className="w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-semibold text-[#6A6C6A] hover:border-[#163300]/40 transition-colors">Cancel</button>
              <button onClick={submit} disabled={loading} className="flex-1 py-3 bg-[#163300] text-[#9FE870] font-bold text-[14px] rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
