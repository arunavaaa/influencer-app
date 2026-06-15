'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

type Tab = { value: string; label: string }

// variant="default" — white card with subtle active state (sidebar pages)
// variant="pills"   — dark pill active state (campaign detail applicant tabs)
export function FilterTabs({
  tabs,
  paramKey = 'filter',
  variant = 'default',
  wrapperClassName,
  skeleton,
  children,
}: {
  tabs: Tab[]
  paramKey?: string
  variant?: 'default' | 'pills'
  wrapperClassName?: string
  skeleton: React.ReactNode
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const current = searchParams.get(paramKey) ?? tabs[0].value

  useEffect(() => {
    setLoading(false)
  }, [searchParams])

  function navigate(value: string) {
    if (value === current) return
    setLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    if (value === tabs[0].value) {
      params.delete(paramKey)
    } else {
      params.set(paramKey, value)
    }
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const isDefault = variant === 'default'

  return (
    <>
      <div className={wrapperClassName ?? (isDefault
        ? 'flex gap-2 mb-6 bg-white rounded-[14px] p-1 w-fit flex-wrap'
        : 'flex gap-2 mb-5 flex-wrap')}>
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => navigate(tab.value)}
            className={isDefault
              ? `px-4 py-2 rounded-[10px] text-[13px] font-semibold capitalize transition-colors ${
                  current === tab.value
                    ? 'bg-[#EDEFEB] text-[#163300] font-bold'
                    : 'text-[#6A6C6A] hover:text-[#121511]'
                }`
              : `px-4 py-1.5 rounded-full text-[13px] font-semibold capitalize transition-colors ${
                  current === tab.value
                    ? 'bg-[#163300] text-[#9FE870] font-bold'
                    : 'bg-[#EDEFEB] text-[#6A6C6A] hover:text-[#121511]'
                }`
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? skeleton : children}
    </>
  )
}
