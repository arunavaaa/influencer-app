'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserCircle2, Settings, LogOut, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  displayName: string
  avatarUrl:   string | null
}

export function SidebarProfileMenu({ displayName, avatarUrl }: Props) {
  const [open, setOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="relative px-3 py-3 border-t border-[#E8E8E8]">
      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-[16px] border border-[#E8E8E8] shadow-xl overflow-hidden z-40">
          <Link href="/profile/edit" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-[#4A4C4A] hover:bg-[#EDEFEB] transition-colors">
            <UserCircle2 className="w-4 h-4 text-[#6A6C6A]" /> Edit Profile
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-[#4A4C4A] hover:bg-[#EDEFEB] transition-colors">
            <Settings className="w-4 h-4 text-[#6A6C6A]" /> Settings
          </Link>
          <div className="border-t border-[#F0F0F0]" />
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}

      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-2 py-2 rounded-[12px] hover:bg-[#EDEFEB] transition-colors">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#163300] flex-shrink-0 overflow-hidden flex items-center justify-center text-[#9FE870] font-black text-[15px]">
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            : <span>{displayName?.[0]?.toUpperCase() ?? '?'}</span>}
        </div>
        {/* Name + role */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-bold text-[#121511] truncate leading-tight">{displayName}</p>
          <p className="text-[11px] text-[#9A9C9A] leading-tight mt-0.5">Creator</p>
        </div>
        <ChevronUp className={`w-3.5 h-3.5 text-[#9A9C9A] flex-shrink-0 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  )
}
