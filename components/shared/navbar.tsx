'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Role = {
  isBrand: boolean
  isInfluencer: boolean
}

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>({ isBrand: false, isInfluencer: false })
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const [{ data: brand }, { data: influencer }] = await Promise.all([
          supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle(),
          supabase.from('influencer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
        ])
        setRole({ isBrand: !!brand, isInfluencer: !!influencer })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setRole({ isBrand: false, isInfluencer: false })
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Hide navbar on auth/onboarding routes — all hooks must be called first
  const hide = pathname?.startsWith('/onboarding') || pathname?.startsWith('/login')
  if (hide) return null

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initial = user?.email?.[0]?.toUpperCase() || '?'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[#EDEFEB] border-b border-[#E8E8E8]"
      style={{ height: '64px' }}
    >
      <div className="px-5 md:px-[70px] h-full">
      <div className="max-w-[1360px] mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-[20px] font-black text-[#163300] hover:opacity-80 transition-opacity tracking-tight"
        >
          Crayon
        </Link>

        {/* Nav Links — center */}
        {!loading && (
          <div className="hidden md:flex items-center gap-1">
            {!user && (
              <>
                <NavLink href="/brand/discover" current={pathname}>Find Creators</NavLink>
                <NavLink href="/#how-it-works" current={pathname}>How It Works</NavLink>
                <NavLink href="/pricing" current={pathname}>Pricing</NavLink>
              </>
            )}

            {user && role.isBrand && (
              <>
                <NavLink href="/brand/discover" current={pathname}>Discover</NavLink>
                <NavLink href="/brand/campaigns" current={pathname}>Campaigns</NavLink>
                <NavLink href="/brand/library" current={pathname}>Library</NavLink>
                <NavLink href="/brand/track" current={pathname}>Track</NavLink>
              </>
            )}

            {user && role.isInfluencer && !role.isBrand && (
              <>
                <NavLink href="/influencer/home" current={pathname}>Dashboard</NavLink>
                <NavLink href="/influencer/home" current={pathname}>My Packages</NavLink>
                <NavLink href="/influencer/campaigns" current={pathname}>Campaigns</NavLink>
              </>
            )}

            {user && !role.isBrand && !role.isInfluencer && (
              <NavLink href="/onboarding/select-role" current={pathname}>Finish Setup</NavLink>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-[15px] font-semibold text-[#121511] hover:opacity-70 transition-opacity px-4 py-2 focus-visible:underline"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="hidden sm:block text-[14px] font-bold text-[#163300] border-2 border-[#163300]/25 px-4 py-2 rounded-full hover:border-[#163300] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#163300]"
              >
                Join as Brand
              </Link>
              <Link
                href="/onboarding/creator"
                className="bg-[#9FE870] text-[#163300] font-bold text-[14px] px-5 py-2.5 rounded-full hover:bg-[#8fdc60] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163300]"
              >
                Join as Creator
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="w-9 h-9 rounded-full bg-[#163300] text-[#9FE870] text-[14px] font-black flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                {initial}
              </button>

              {avatarMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-[16px] border border-[#E8E8E8] shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#E8E8E8]">
                    <p className="text-[13px] text-[#6A6C6A] truncate">{user.email}</p>
                  </div>
                  {role.isInfluencer && (
                    <DropdownItem href="/influencer/home" label="My Profile" />
                  )}
                  {role.isBrand && (
                    <DropdownItem href="/brand/home" label="Dashboard" />
                  )}
                  <DropdownItem href="/billing" label="Billing" />
                  <DropdownItem href="/account" label="Account" />
                  <DropdownItem href="/referrals" label="Referrals" />
                  <div className="border-t border-[#E8E8E8]">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-[15px] text-red-600 hover:bg-[#EDEFEB] transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </nav>
  )
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string
  current: string | null
  children: React.ReactNode
}) {
  // Match exact path, ignoring hash for how-it-works
  const hrefPath = href.split('#')[0] || '/'
  const isActive = current === hrefPath && hrefPath !== '/'

  return (
    <Link
      href={href}
      className={`text-[15px] font-semibold px-4 py-2 rounded-full transition-colors relative ${
        isActive
          ? 'bg-[#121511] text-white font-bold'
          : 'text-[#4A4C4A] hover:text-[#121511] hover:bg-[#E8E8E8]'
      }`}
    >
      {children}
    </Link>
  )
}

function DropdownItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-3 text-[15px] text-[#121511] hover:bg-[#EDEFEB] transition-colors"
    >
      {label}
    </Link>
  )
}
