'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-[#F5F5F5] text-[#6A6C6A]',
  shortlisted: 'bg-blue-50 text-blue-700',
  selected: 'bg-[#9FE870]/20 text-[#163300]',
  rejected: 'bg-red-50 text-red-600',
}

export type ApplicationForPanel = {
  id: string
  status: string
  cover_note: string | null
  proposed_rate_inr: number | null
  created_at: string
  creator_profiles: {
    id: string
    display_name: string | null
    city: string | null
    niches: string[] | null
    instagram_followers: number | null
    username: string | null
    profile_photo_url: string | null
  } | null
}

export function ApplicationsPanel({
  applications: initialApps,
  campaignId,
  brandId,
}: {
  applications: ApplicationForPanel[]
  campaignId: string
  brandId: string
}) {
  const [applications, setApplications] = useState(initialApps)
  const [reviewing, setReviewing] = useState<ApplicationForPanel | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(app: ApplicationForPanel, status: string) {
    setLoading(status)
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', app.id)

    if (error) { toast.error('Failed to update'); setLoading(null); return }

    const creatorId = app.creator_profiles?.id
    if (creatorId && status === 'selected') {
      await supabase.from('conversations').upsert(
        { brand_id: brandId, creator_id: creatorId, initiated_by: 'brand', creator_accepted: true, campaign_id: campaignId },
        { onConflict: 'brand_id,creator_id' }
      )
      await supabase.from('notifications').insert({ user_id: creatorId, type: 'selected', message: `You've been selected for the campaign!`, link: '/applications' })
    }
    if (creatorId && status === 'shortlisted') {
      await supabase.from('notifications').insert({ user_id: creatorId, type: 'shortlisted', message: `You've been shortlisted!`, link: '/applications' })
    }

    const statusLabel: Record<string, string> = {
      shortlisted: 'Shortlisted ⭐',
      selected: 'Selected ✓',
      rejected: 'Rejected',
    }
    toast.success(statusLabel[status] ?? `Marked as ${status}`)
    setLoading(null)

    const updated = { ...app, status }
    setApplications(prev => prev.map(a => a.id === app.id ? updated : a))
    if (reviewing?.id === app.id) setReviewing(updated)
    router.refresh()
  }

  async function openChat(app: ApplicationForPanel) {
    const creatorId = app.creator_profiles?.id
    if (!creatorId) return
    setLoading('chat')
    const { data: existing } = await supabase.from('conversations').select('id').eq('brand_id', brandId).eq('creator_id', creatorId).maybeSingle()
    if (existing) { window.location.href = `/brand/messages/${existing.id}`; return }
    const { data } = await supabase.from('conversations').insert({ brand_id: brandId, creator_id: creatorId, initiated_by: 'brand', creator_accepted: true, campaign_id: campaignId }).select('id').single()
    if (data) window.location.href = `/brand/messages/${data.id}`
    setLoading(null)
  }

  if (!applications.length) {
    return (
      <div className="text-center py-14">
        <p className="text-[40px] mb-3">📭</p>
        <p className="text-[16px] font-bold text-[#121511]">No applications yet</p>
        <p className="text-[14px] text-[#6A6C6A] mt-1">Creators who match your brief will apply here</p>
      </div>
    )
  }

  return (
    <>
      {/* Application cards */}
      <div className="space-y-3">
        {applications.map(app => {
          const cp = app.creator_profiles
          const initial = cp?.display_name?.[0]?.toUpperCase() ?? '?'

          return (
            <div key={app.id} className="border border-[#E8E8E8] rounded-[16px] p-4 hover:border-[#163300]/20 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar — photo if available, else initial */}
                <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[15px]">
                  {cp?.profile_photo_url
                    ? <img src={cp.profile_photo_url} alt={cp.display_name ?? ''} className="w-full h-full object-cover" />
                    : initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-[15px] font-black text-[#121511] truncate">{cp?.display_name ?? 'Creator'}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize flex-shrink-0 ${STATUS_COLOR[app.status]}`}>{app.status}</span>
                  </div>
                  <p className="text-[13px] text-[#6A6C6A]">{cp?.city ?? '—'}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {(cp?.instagram_followers ?? 0) > 0 && (
                      <span className="text-[12px] text-[#6A6C6A]">📸 {cp!.instagram_followers!.toLocaleString('en-IN')} followers</span>
                    )}
                    {app.proposed_rate_inr && (
                      <span className="text-[12px] font-bold text-[#163300]">₹{app.proposed_rate_inr.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  {app.cover_note && (
                    <p className="text-[13px] text-[#4A4C4A] mt-1.5 line-clamp-1 italic">"{app.cover_note}"</p>
                  )}
                </div>
              </div>
              {/* Buttons — both right-aligned together */}
              <div className="flex items-center justify-end gap-2 mt-3">
                {cp?.username && (
                  <Link href={`/${cp.username}`} target="_blank" className="px-3 py-1.5 bg-[#EDEFEB] text-[#121511] text-[12px] font-semibold rounded-full hover:bg-[#E0E2DE] transition-colors">
                    View Profile
                  </Link>
                )}
                <button
                  onClick={() => setReviewing(app)}
                  className="px-4 py-1.5 bg-[#163300] text-[#9FE870] text-[12px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors"
                >
                  Review Application →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setReviewing(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[520px] max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start gap-3 p-5 pb-4 border-b border-[#E8E8E8]">
              <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[16px]">
                {reviewing.creator_profiles?.profile_photo_url
                  ? <img src={reviewing.creator_profiles.profile_photo_url} alt={reviewing.creator_profiles.display_name ?? ''} className="w-full h-full object-cover" />
                  : reviewing.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-black text-[#121511]">{reviewing.creator_profiles?.display_name ?? 'Creator'}</p>
                <p className="text-[13px] text-[#6A6C6A]">{reviewing.creator_profiles?.city ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_COLOR[reviewing.status]}`}>{reviewing.status}</span>
                <button
                  onClick={() => setReviewing(null)}
                  className="w-8 h-8 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[20px] leading-none text-[#6A6C6A] hover:bg-[#E0E2DE] transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Stats */}
              <div className="flex gap-5 flex-wrap">
                {(reviewing.creator_profiles?.instagram_followers ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A9C9A]">Instagram</p>
                    <p className="text-[18px] font-black text-[#121511]">{reviewing.creator_profiles!.instagram_followers!.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-[#9A9C9A]">followers</p>
                  </div>
                )}
                {reviewing.proposed_rate_inr && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A9C9A]">Proposed Rate</p>
                    <p className="text-[18px] font-black text-[#163300]">₹{reviewing.proposed_rate_inr.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>

              {/* Niches */}
              {(reviewing.creator_profiles?.niches ?? []).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A9C9A] mb-2">Niches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewing.creator_profiles!.niches!.map(n => (
                      <span key={n} className="px-2.5 py-0.5 bg-[#F5F5F5] text-[#4A4C4A] text-[12px] font-semibold rounded-full">{n}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover note */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A9C9A] mb-2">Cover Note</p>
                {reviewing.cover_note ? (
                  <p className="text-[15px] text-[#121511] leading-relaxed whitespace-pre-wrap">{reviewing.cover_note}</p>
                ) : (
                  <p className="text-[14px] text-[#9A9C9A] italic">No cover note provided</p>
                )}
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-5 pt-4 border-t border-[#E8E8E8] space-y-2">
              {reviewing.creator_profiles?.username && (
                <Link
                  href={`/${reviewing.creator_profiles.username}`}
                  target="_blank"
                  className="flex items-center justify-center w-full py-2.5 bg-[#EDEFEB] text-[#121511] text-[14px] font-semibold rounded-[12px] hover:bg-[#E0E2DE] transition-colors"
                >
                  View Full Profile ↗
                </Link>
              )}

              {/* Status-change actions */}
              {reviewing.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(reviewing, 'shortlisted')}
                    disabled={!!loading}
                    className="flex-1 py-2.5 bg-blue-50 text-blue-700 text-[13px] font-bold rounded-[12px] hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    {loading === 'shortlisted' ? '...' : '⭐ Shortlist'}
                  </button>
                  <button
                    onClick={() => updateStatus(reviewing, 'rejected')}
                    disabled={!!loading}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 text-[13px] font-bold rounded-[12px] hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    {loading === 'rejected' ? '...' : 'Reject'}
                  </button>
                </div>
              )}
              {reviewing.status === 'shortlisted' && (
                <button
                  onClick={() => updateStatus(reviewing, 'selected')}
                  disabled={!!loading}
                  className="w-full py-2.5 bg-[#9FE870]/20 text-[#163300] text-[13px] font-bold rounded-[12px] hover:bg-[#9FE870]/30 transition-colors disabled:opacity-60"
                >
                  {loading === 'selected' ? '...' : '✓ Mark as Selected'}
                </button>
              )}
              {reviewing.status === 'rejected' && (
                <button
                  onClick={() => updateStatus(reviewing, 'pending')}
                  disabled={!!loading}
                  className="w-full py-2.5 bg-[#EDEFEB] text-[#121511] text-[13px] font-semibold rounded-[12px] hover:bg-[#E0E2DE] transition-colors disabled:opacity-60"
                >
                  {loading === 'pending' ? '...' : 'Undo Reject'}
                </button>
              )}

              {/* Message — always available, no shortlist required */}
              <button
                onClick={() => openChat(reviewing)}
                disabled={!!loading}
                className="w-full py-2.5 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-[12px] hover:bg-[#1f4a00] transition-colors disabled:opacity-60"
              >
                {loading === 'chat' ? '...' : '💬 Message Creator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
