'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId)
    if (error) { toast.error('Failed to delete campaign'); setDeleting(false); return }
    toast.success('Campaign deleted')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="mt-3 p-3 bg-red-50 rounded-[14px] border border-red-100">
        <p className="text-[12px] font-semibold text-[#121511] mb-2.5">
          Delete this campaign? <span className="text-[#6A6C6A] font-normal">All applications will also be removed and this cannot be undone.</span>
        </p>
        <div className="flex gap-2">
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-1.5 bg-red-600 text-white text-[12px] font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
            {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
            Yes, delete permanently
          </button>
          <button onClick={() => setConfirming(false)}
            className="px-4 py-1.5 bg-white text-[#4A4C4A] text-[12px] font-semibold rounded-full border border-[#E8E8E8] hover:bg-[#F5F5F5] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="px-4 py-2 text-[#9A9C9A] hover:text-red-500 text-[13px] font-semibold rounded-full hover:bg-red-50 transition-colors flex items-center gap-1.5">
      <Trash2 className="w-3.5 h-3.5" />
      Delete
    </button>
  )
}
