'use client'

import { useState } from 'react'

const COLLAPSED_HEIGHT = '7.8rem' // ~5 lines at text-[15px] leading-relaxed

export function GoalText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  // Show toggle if text is long enough to overflow ~5 lines
  const needsTruncation =
    text.length > 400 || text.split('\n').filter(l => l.trim()).length > 5

  return (
    <div>
      <div
        className="text-[15px] text-[#121511] leading-relaxed whitespace-pre-wrap overflow-hidden"
        style={expanded ? {} : { maxHeight: COLLAPSED_HEIGHT }}
      >
        {text}
      </div>
      {needsTruncation && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[13px] font-semibold text-[#163300] hover:underline mt-2 block"
        >
          {expanded ? 'View less ↑' : 'View more ↓'}
        </button>
      )}
    </div>
  )
}
