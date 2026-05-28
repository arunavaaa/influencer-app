'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function MessageBrandButton({
  creatorId,
  brandId,
  campaignId,
  existingConvoId,
}: {
  creatorId: string
  brandId: string
  campaignId: string
  existingConvoId: string | null
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (existingConvoId) {
      window.location.href = `/messages/${existingConvoId}`
      return
    }
    setLoading(true)
    const supabase = createClient()
    // Upsert so we never create duplicates
    const { data } = await supabase
      .from('conversations')
      .upsert(
        { brand_id: brandId, creator_id: creatorId, initiated_by: 'creator', creator_accepted: true, campaign_id: campaignId },
        { onConflict: 'brand_id,creator_id' }
      )
      .select('id')
      .single()
    if (data) window.location.href = `/messages/${data.id}`
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60"
    >
      {loading ? '...' : '💬 Message Brand'}
    </button>
  )
}
