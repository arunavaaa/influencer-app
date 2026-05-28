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

function Dot() {
  return <span className="ml-auto w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
}

export function CreatorSideNav({
  pendingRequestsCount = 0,
  unreadNotifsCount = 0,
}: {
  pendingRequestsCount?: number
  unreadNotifsCount?: number
}) {
  const pathname = usePathname()

  const LINKS = [
    { href: '/dashboard',    label: 'Dashboard',        badge: null },
    { href: '/campaigns',    label: 'Browse Campaigns', badge: null },
    { href: '/applications', label: 'My Applications',  badge: unreadNotifsCount > 0 ? 'dot' as const : null },
    { href: '/projects',     label: 'Active Projects',  badge: null },
    { href: '/messages',     label: 'Messages',         badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
  ]

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {LINKS.map(({ href, label, badge }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
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
            {badge === 'dot' && <Dot />}
            {typeof badge === 'number' && <Badge count={badge} />}
          </Link>
        )
      })}
    </nav>
  )
}
