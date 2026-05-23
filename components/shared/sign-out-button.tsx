'use client'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  return (
    <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
      <span className="text-[16px]">🚪</span> Sign Out
    </button>
  )
}
