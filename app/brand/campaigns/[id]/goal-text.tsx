'use client'

import { useState } from 'react'

// Trim to the nearest word boundary before the limit so we don't cut mid-word
function trimToWord(str: string, limit: number): string {
  if (str.length <= limit) return str
  return str.slice(0, limit).replace(/\s\S*$/, '').trimEnd()
}

const CHAR_LIMIT = 320 // ~4 lines on a typical desktop container

export function GoalText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncation = text.length > CHAR_LIMIT

  if (!needsTruncation) {
    return <p className="text-[15px] text-[#121511] leading-relaxed whitespace-pre-wrap">{text}</p>
  }

  const truncated = trimToWord(text, CHAR_LIMIT)

  return (
    <p className="text-[15px] text-[#121511] leading-relaxed whitespace-pre-wrap">
      {expanded ? text : truncated + '…'}
      {' '}
      <button
        onClick={() => setExpanded(e => !e)}
        className="text-[14px] font-semibold text-[#163300] underline underline-offset-2 hover:text-[#1f4a00] transition-colors"
      >
        {expanded ? 'View less ↑' : 'View more ↓'}
      </button>
    </p>
  )
}
