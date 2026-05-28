'use client'

import { useRouter } from 'next/navigation'

export function BackLink({ fallback = '/', label = 'Back' }: { fallback?: string; label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors mb-8 inline-block"
    >
      ← {label}
    </button>
  )
}
