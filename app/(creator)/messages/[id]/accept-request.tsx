'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function AcceptRequest({ conversationId }: { conversationId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  async function respond(accept: boolean) {
    setLoading(accept ? 'accept' : 'decline')
    await supabase.from('conversations').update({ creator_accepted: accept }).eq('id', conversationId)
    toast.success(accept ? 'Request accepted! You can now chat.' : 'Request declined.')
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-3">
      <button onClick={() => respond(true)} disabled={!!loading}
        className="px-5 py-2 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60">
        {loading === 'accept' ? 'Accepting...' : 'Accept ✓'}
      </button>
      <button onClick={() => respond(false)} disabled={!!loading}
        className="px-5 py-2 border-2 border-[#E8E8E8] text-[#6A6C6A] text-[13px] font-semibold rounded-full hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-60">
        {loading === 'decline' ? 'Declining...' : 'Decline'}
      </button>
    </div>
  )
}
