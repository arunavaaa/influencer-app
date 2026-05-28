'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/brand/dashboard',  label: 'Dashboard' },
  { href: '/brand/campaigns',  label: 'My Campaigns' },
  { href: '/brand/search',     label: 'Search Creators' },
  { href: '/brand/messages',   label: 'Messages' },
]

export function BrandSideNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {LINKS.map(({ href, label }) => {
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
          </Link>
        )
      })}
    </nav>
  )
}
