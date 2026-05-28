'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function BrandSideNav({ unreadMessagesCount = 0, newAppsCount = 0 }: { unreadMessagesCount?: number; newAppsCount?: number }) {
  const pathname = usePathname()

  const LINKS = [
    { href: '/brand/dashboard',  label: 'Dashboard',        badge: null },
    { href: '/brand/campaigns',  label: 'My Campaigns',     badge: newAppsCount > 0 ? newAppsCount : null },
    { href: '/brand/search',     label: 'Search Creators',  badge: null },
    { href: '/brand/messages',   label: 'Messages',         badge: unreadMessagesCount > 0 ? unreadMessagesCount : null },
  ]

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {LINKS.map(({ href, label, badge }) => {
        const active = pathname === href || (href !== '/brand/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2.5 rounded-[12px] text-[14px] font-semibold transition-colors ${
              active
                ? 'bg-[#EDEFEB] text-[#163300] font-bold'
                : 'text-[#4A4C4A] hover:bg-[#EDEFEB] hover:text-[#121511]'
            }`}
          >
            {label}
            {typeof badge === 'number' && <Badge count={badge} />}
          </Link>
        )
      })}
    </nav>
  )
}
