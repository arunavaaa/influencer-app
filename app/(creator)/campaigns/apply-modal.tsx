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

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Campaign Details modal (read-only) ──────────────────────────────────────
function CampaignDetailModal({ campaign, onApply, onClose }: {
  campaign: Campaign
  onApply: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[600px] shadow-xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F0F0F0] flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {campaign.brand_name && (
              <p className="text-[12px] font-semibold text-[#6A6C6A] mb-0.5">{campaign.brand_name}</p>
            )}
            <h3 className="text-[18px] font-black text-[#121511] leading-tight">{campaign.title}</h3>
          </div>
          <button onClick={onClose} className="text-[#9A9C9A] hover:text-[#121511] flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body — quick info first, description last */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Platform / Format / Niche — 3 equal-width columns side by side */}
          {((campaign.platforms?.length ?? 0) > 0 ||
            (campaign.deliverable_formats?.length ?? 0) > 0 ||
            (campaign.niches?.length ?? 0) > 0) && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-1.5">Platform</p>
                <div className="flex flex-wrap gap-1.5">
                  {(campaign.platforms?.length ?? 0) > 0
                    ? campaign.platforms?.map(p => (
                        <span key={p} className="text-[12px] px-3 py-1 bg-[#F0F7EC] text-[#163300] rounded-full font-bold border border-[#163300]/15">{p}</span>
                      ))
                    : <span className="text-[13px] text-[#C0C2C0]">—</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-1.5">Deliverable Format</p>
                <div className="flex flex-wrap gap-1.5">
                  {(campaign.deliverable_formats?.length ?? 0) > 0
                    ? campaign.deliverable_formats?.map(f => (
                        <span key={f} className="text-[12px] px-3 py-1 bg-[#F5F0FF] text-purple-700 rounded-full font-semibold">{f}</span>
                      ))
                    : <span className="text-[13px] text-[#C0C2C0]">—</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-1.5">Looking for Creators in</p>
                <div className="flex flex-wrap gap-1.5">
                  {(campaign.niches?.length ?? 0) > 0
                    ? campaign.niches?.map(n => (
                        <span key={n} className="text-[12px] px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">{n}</span>
                      ))
                    : <span className="text-[13px] text-[#C0C2C0]">—</span>}
                </div>
              </div>
            </div>
          )}

          {/* Budget + deadlines */}
          {(campaign.budget_inr || campaign.application_deadline || campaign.content_deadline) && (
            <div className="flex flex-wrap gap-6 py-4 border-y border-[#F0F0F0]">
              {campaign.budget_inr && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-0.5">Budget</p>
                  <p className="text-[18px] font-black text-[#163300]">₹{campaign.budget_inr.toLocaleString('en-IN')}</p>
                </div>
              )}
              {campaign.application_deadline && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-0.5">Apply by</p>
                  <p className="text-[14px] font-bold text-[#4A4C4A]">{fmtDate(campaign.application_deadline)}</p>
                </div>
              )}
              {campaign.content_deadline && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] mb-0.5">Deliver by</p>
                  <p className="text-[14px] font-bold text-[#4A4C4A]">{fmtDate(campaign.content_deadline)}</p>
                </div>
              )}
            </div>
          )}

          {/* Campaign description — after all quick info */}
          {campaign.goal && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-1.5">What the brand needs</p>
              <p className="text-[14px] text-[#4A4C4A] leading-relaxed whitespace-pre-wrap">{campaign.goal}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F0F0] flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-semibold text-[#6A6C6A] hover:border-[#163300]/40 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-3 bg-[#163300] text-[#9FE870] font-bold text-[14px] rounded-full hover:bg-[#1f4a00] transition-colors"
          >
            Apply to Campaign →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Application Form modal (focused, no campaign details) ───────────────────
function ApplyFormModal({ campaignId, creatorId, brandUserId, campaign, onSuccess, onClose }: {
  campaignId: string
  creatorId: string
  brandUserId: string | null
  campaign: Campaign
  onSuccess: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [coverNote, setCoverNote] = useState('')
  const [rate, setRate] = useState('')
  const [loading, setLoading] = useState(false)

  const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
  const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

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
    if (brandUserId) {
      await supabase.from('notifications').insert({
        user_id: brandUserId,
        type: 'new_application',
        message: `You have a new application for "${campaign.title}"`,
        link: `/brand/campaigns`,
        read: false,
      })
    }
    toast.success('Application submitted! 🎉')
    onSuccess()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[520px] shadow-xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F0F0F0] flex-shrink-0">
          <div>
            <h3 className="text-[18px] font-black text-[#121511]">Apply to Campaign</h3>
            <p className="text-[13px] text-[#6A6C6A] mt-0.5 truncate max-w-[360px]">{campaign.title}</p>
          </div>
          <button onClick={onClose} className="text-[#9A9C9A] hover:text-[#121511] flex-shrink-0 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — just the form */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className={L}>Cover Note *</label>
            <textarea
              rows={5} maxLength={500} value={coverNote} onChange={e => setCoverNote(e.target.value)}
              placeholder="Tell the brand why you're a great fit. What's your audience like? How would you approach this campaign? (50–500 chars)"
              className={`${I} resize-none`}
            />
            <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{coverNote.length}/500</p>
          </div>
          <div>
            <label className={L}>Your Rate (₹) — Optional</label>
            <input
              type="number" value={rate} onChange={e => setRate(e.target.value)}
              placeholder="Leave blank to discuss"
              className={I}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#F0F0F0] flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-semibold text-[#6A6C6A] hover:border-[#163300]/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit} disabled={loading}
            className="flex-1 py-3 bg-[#163300] text-[#9FE870] font-bold text-[14px] rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main export: two-button actions on each campaign card ────────────────────
export function CampaignActions({ campaignId, creatorId, brandUserId, campaign, applied = false }: {
  campaignId: string
  creatorId: string
  brandUserId: string | null
  campaign: Campaign
  applied?: boolean
}) {
  const router = useRouter()
  const [view, setView] = useState<'closed' | 'detail' | 'apply'>('closed')

  function handleSuccess() {
    setView('closed')
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        {/* View Details is always accessible — even after applying */}
        <button
          onClick={() => setView('detail')}
          className="flex-1 py-2.5 border-2 border-[#163300]/20 text-[#163300] text-[13px] font-semibold rounded-full hover:border-[#163300] transition-colors"
        >
          View Details
        </button>
        {applied ? (
          <div className="flex-1 py-2.5 bg-[#9FE870]/20 text-[#163300] text-[13px] font-bold rounded-full text-center">
            Applied ✓
          </div>
        ) : (
          <button
            onClick={() => setView('apply')}
            className="flex-1 py-2.5 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors"
          >
            Apply →
          </button>
        )}
      </div>

      {view === 'detail' && (
        <CampaignDetailModal
          campaign={campaign}
          onApply={() => !applied && setView('apply')}
          onClose={() => setView('closed')}
        />
      )}

      {/* Apply form only if not already applied */}
      {view === 'apply' && !applied && (
        <ApplyFormModal
          campaignId={campaignId}
          creatorId={creatorId}
          brandUserId={brandUserId}
          campaign={campaign}
          onSuccess={handleSuccess}
          onClose={() => setView('closed')}
        />
      )}
    </>
  )
}
