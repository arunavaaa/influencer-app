'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ApplicationActions({ applicationId, creatorId, campaignId, brandId, currentStatus }: {
  applicationId: string; creatorId: string; campaignId: string; brandId: string; currentStatus: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    const { error } = await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', applicationId)
    if (error) { toast.error('Failed to update'); setLoading(null); return }

    if (status === 'selected') {
      await supabase.from('conversations').upsert({ brand_id: brandId, creator_id: creatorId, initiated_by: 'brand', creator_accepted: true, campaign_id: campaignId }, { onConflict: 'brand_id,creator_id' })
      await supabase.from('notifications').insert({ user_id: creatorId, type: 'selected', message: `You've been selected for the campaign!`, link: `/applications` })
    }
    if (status === 'shortlisted') {
      await supabase.from('notifications').insert({ user_id: creatorId, type: 'shortlisted', message: `You've been shortlisted!`, link: `/applications` })
    }

    toast.success(`Application ${status}`)
    setLoading(null)
    router.refresh()
  }

  async function openChat() {
    setLoading('chat')
    const { data: existing } = await supabase.from('conversations').select('id').eq('brand_id', brandId).eq('creator_id', creatorId).maybeSingle()
    if (existing) { window.location.href = `/brand/messages/${existing.id}`; return }
    const { data } = await supabase.from('conversations').insert({ brand_id: brandId, creator_id: creatorId, initiated_by: 'brand', creator_accepted: true, campaign_id: campaignId }).select('id').single()
    if (data) window.location.href = `/brand/messages/${data.id}`
    setLoading(null)
  }

  return (
    <>
      {currentStatus === 'pending' && (
        <>
          <button onClick={() => updateStatus('shortlisted')} disabled={!!loading} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[12px] font-bold rounded-full hover:bg-blue-100 transition-colors disabled:opacity-60">
            {loading === 'shortlisted' ? '...' : 'Shortlist'}
          </button>
          <button onClick={() => updateStatus('rejected')} disabled={!!loading} className="px-3 py-1.5 bg-red-50 text-red-600 text-[12px] font-bold rounded-full hover:bg-red-100 transition-colors disabled:opacity-60">
            {loading === 'rejected' ? '...' : 'Reject'}
          </button>
        </>
      )}
      {currentStatus === 'shortlisted' && (
        <button onClick={() => updateStatus('selected')} disabled={!!loading} className="px-3 py-1.5 bg-[#9FE870]/20 text-[#163300] text-[12px] font-bold rounded-full hover:bg-[#9FE870]/30 transition-colors disabled:opacity-60">
          {loading === 'selected' ? '...' : 'Select ✓'}
        </button>
      )}
      {(currentStatus === 'shortlisted' || currentStatus === 'selected') && (
        <button onClick={openChat} disabled={!!loading} className="px-3 py-1.5 bg-[#163300] text-[#9FE870] text-[12px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60">
          {loading === 'chat' ? '...' : 'Message'}
        </button>
      )}
    </>
  )
}
