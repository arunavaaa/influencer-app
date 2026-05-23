'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Compass, ClipboardList, MessageSquare,
  Package, IndianRupee, Bell, Settings, ChevronDown,
  LogOut, User,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/influencer/home', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/influencer/campaigns', icon: Compass, label: 'Discover Campaigns' },
  { href: '/influencer/applications', icon: ClipboardList, label: 'Applications', badge: 'applications' },
  { href: '/influencer/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/influencer/orders', icon: Package, label: 'Active Deals', badge: 'orders' },
  { href: '/influencer/earnings', icon: IndianRupee, label: 'Payments' },
]

const BOTTOM_NAV_ITEMS = [
  { href: '/influencer/notifications', icon: Bell, label: 'Notifications', badge: 'notifications' },
  { href: '/influencer/settings', icon: Settings, label: 'Settings' },
]

const DASHBOARD_PREFIXES = [
  '/influencer/home',
  '/influencer/campaigns',
  '/influencer/applications',
  '/influencer/messages',
  '/influencer/orders',
  '/influencer/earnings',
  '/influencer/notifications',
  '/influencer/settings',
  '/influencer/profile',
]

type Profile = {
  id: string
  display_name: string
  profile_photo_url: string | null
  profile_title: string | null
}

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingApplications, setPendingApplications] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const isDashboard = DASHBOARD_PREFIXES.some(p => pathname?.startsWith(p))

  useEffect(() => {
    if (!isDashboard) return
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase
        .from('influencer_profiles')
        .select('id, display_name, profile_photo_url, profile_title')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!p) return
      setProfile(p)

      const [{ count: pending }, { count: apps }, { count: unread }] = await Promise.all([
        supabase.from('contracts').select('*', { count: 'exact', head: true })
          .eq('influencer_id', p.id).eq('status', 'pending_acceptance'),
        supabase.from('applications').select('*', { count: 'exact', head: true })
          .eq('influencer_id', p.id).eq('status', 'pending'),
        supabase.from('notifications').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('read', false),
      ])
      setPendingCount(pending || 0)
      setPendingApplications(apps || 0)
      setUnreadNotifications(unread || 0)
    }
    load()
  }, [isDashboard, pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!isDashboard) return <>{children}</>

  const initial = profile?.display_name?.[0]?.toUpperCase() || 'C'

  function getBadge(badge?: string) {
    if (badge === 'orders') return pendingCount
    if (badge === 'applications') return pendingApplications
    if (badge === 'notifications') return unreadNotifications
    return 0
  }

  return (
    <div className="flex min-h-screen bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* ── SIDEBAR ── */}
      <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-[#E8E8E8] flex flex-col z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#E8E8E8] flex-shrink-0">
          <span className="text-[20px] font-black text-[#163300] tracking-tight">Crayon</span>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || (href !== '/influencer/home' && pathname?.startsWith(href))
            const count = getBadge(badge)
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors ${
                  active ? 'bg-[#9FE870] text-[#163300]' : 'text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-[#121511]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Divider */}
          <div className="h-px bg-[#E8E8E8] my-2" />

          {/* Profile link */}
          <Link
            href="/influencer/profile/edit"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors ${
              pathname?.startsWith('/influencer/profile') ? 'bg-[#9FE870] text-[#163300]' : 'text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-[#121511]'
            }`}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            My Profile
          </Link>

          {/* Bottom nav items */}
          {BOTTOM_NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname?.startsWith(href)
            const count = getBadge(badge)
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors ${
                  active ? 'bg-[#9FE870] text-[#163300]' : 'text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-[#121511]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Profile at bottom */}
        <div className="p-3 border-t border-[#E8E8E8] flex-shrink-0 relative" ref={dropdownRef}>
          {dropdownOpen && (
            <div className="absolute bottom-[76px] left-3 right-3 bg-white rounded-[14px] border border-[#E8E8E8] shadow-lg overflow-hidden z-50">
              <Link
                href="/influencer/profile/edit"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-[14px] text-[#121511] hover:bg-[#EDEFEB] transition-colors"
              >
                <User className="w-4 h-4 text-[#6A6C6A] flex-shrink-0" />
                Edit Profile
              </Link>
              <div className="border-t border-[#E8E8E8]">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-red-600 hover:bg-[#EDEFEB] transition-colors"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-[#EDEFEB] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] text-[13px] font-black flex-shrink-0 overflow-hidden">
              {profile?.profile_photo_url
                ? <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                : initial
              }
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[13px] font-bold text-[#121511] truncate leading-tight">
                {profile?.display_name || 'Creator'}
              </p>
              <p className="text-[11px] text-[#6A6C6A]">Creator</p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#B0B2AF] flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 ml-[240px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
