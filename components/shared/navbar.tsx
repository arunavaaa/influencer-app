'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Role = { isBrand: boolean; isCreator: boolean }

const HIDE_PATHS = [
  '/onboarding', '/login', '/signup',
  '/brand/dashboard', '/brand/campaigns', '/brand/search', '/brand/messages', '/brand/profile',
  '/dashboard', '/campaigns', '/applications', '/projects', '/messages', '/profile/edit', '/settings',
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>({ isBrand: false, isCreator: false })
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  // Compute hide before effects so they can bail out on hidden paths
  const hide = HIDE_PATHS.some(p => pathname?.startsWith(p))

  useEffect(() => {
    if (hide) { setLoading(false); return }
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
        if (!data?.role) {
          // Ghost session: user started OAuth but never completed role selection — sign out silently
          await supabase.auth.signOut()
          setUser(null)
          setLoading(false)
          return
        }
        setUser(user)
        setRole({ isBrand: data?.role === 'brand', isCreator: data?.role === 'creator' || data?.role === 'influencer' })
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setRole({ isBrand: false, isCreator: false }); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [hide])

  useEffect(() => {
    if (hide) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [hide])

  if (hide) return null

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#EDEFEB] border-b border-[#E8E8E8]" style={{ height: 64 }}>
      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] h-full flex items-center justify-between">
        <Link
          href={role.isCreator ? '/dashboard' : role.isBrand ? '/brand/dashboard' : '/'}
          className="text-[20px] font-black text-[#163300] hover:opacity-80 transition-opacity tracking-tight"
        >
          GrabCollab
        </Link>

        {!loading && (
          <div className="hidden md:flex items-center gap-1">
            {!user && (
              <>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!loading && !user && (
            <>
              <Link href="/login" className="hidden sm:block text-[15px] font-semibold text-[#121511] hover:opacity-70 transition-opacity px-4 py-2">
                Login
              </Link>
              <Link href="/onboarding/brand" className="hidden sm:block text-[14px] font-bold text-[#163300] border-2 border-[#163300]/25 px-4 py-2 rounded-full hover:border-[#163300] transition-colors">
                Join as Brand
              </Link>
              <Link href="/for-creators" className="bg-[#9FE870] text-[#163300] font-bold text-[14px] px-5 py-2.5 rounded-full hover:bg-[#8fdc60] transition-colors">
                Join as Creator
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="w-9 h-9 rounded-full bg-[#163300] text-[#9FE870] text-[14px] font-black flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                {initial}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-[16px] border border-[#E8E8E8] shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#E8E8E8]">
                    <p className="text-[13px] text-[#6A6C6A] truncate">{user.email}</p>
                  </div>
                  {role.isCreator && (
                    <>
                      <DropdownItem href="/dashboard" label="Creator Dashboard" />
                      <DropdownItem href="/profile/edit" label="Edit Profile" />
                    </>
                  )}
                  {role.isBrand && (
                    <>
                      <DropdownItem href="/brand/dashboard" label="Brand Dashboard" />
                      <DropdownItem href="/brand/profile" label="Edit Profile" />
                    </>
                  )}
                  <div className="border-t border-[#E8E8E8]">
                    <button onClick={signOut} className="w-full text-left px-4 py-3 text-[15px] text-red-600 hover:bg-[#EDEFEB] transition-colors">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({ href, current, children }: { href: string; current: string | null; children: React.ReactNode }) {
  const path = href.split('#')[0] || '/'
  const active = current === path && path !== '/'
  return (
    <Link href={href} className={`text-[15px] font-semibold px-4 py-2 rounded-full transition-colors ${active ? 'bg-[#121511] text-white font-bold' : 'text-[#4A4C4A] hover:text-[#121511] hover:bg-[#E8E8E8]'}`}>
      {children}
    </Link>
  )
}

function DropdownItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block px-4 py-3 text-[15px] text-[#121511] hover:bg-[#EDEFEB] transition-colors">
      {label}
    </Link>
  )
}
