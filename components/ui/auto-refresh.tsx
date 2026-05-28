'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Drop this into any server-rendered page that marks notifications as read.
 * On mount, it calls router.refresh() so the layout re-runs its badge queries
 * and picks up the now-read notifications — making badges disappear immediately.
 */
export function AutoRefresh() {
  const router = useRouter()
  useEffect(() => {
    router.refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
