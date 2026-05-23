'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[#163300] hover:opacity-70 transition-opacity"
      aria-label="Copy profile link"
    >
      {copied ? <Check className="w-4 h-4 text-[#45A905]" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}
