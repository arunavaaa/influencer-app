'use client'
import { useEffect, useState } from 'react'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return Math.round(n / 1_000) + 'K'
  return String(Math.round(n))
}

export function AnimatedStat({
  icon,
  maxValue,
  phase = 0,       // 0–1 starting position in cycle so cards are out of sync
  duration = 9000, // ms for one full cycle
}: {
  icon: string
  maxValue: number
  phase?: number
  duration?: number
}) {
  // Floor is 68% of max — so even the "low" point is respectable
  const minValue = Math.round(maxValue * 0.68)
  const range    = maxValue - minValue

  const [value, setValue] = useState(Math.round(minValue + range * phase))

  useEffect(() => {
    const FPS  = 24
    const ms   = 1000 / FPS
    const step = range / (duration / ms)
    let cur    = minValue + range * phase

    const id = setInterval(() => {
      cur += step
      if (cur > maxValue) cur = minValue
      setValue(Math.round(cur))
    }, ms)

    return () => clearInterval(id)
  }, [maxValue, minValue, range, phase, duration])

  return (
    <div
      className="flex items-center gap-1 rounded-full px-2.5 py-1"
      style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(6px)' }}
    >
      <span style={{ fontSize: '10px', lineHeight: 1 }}>{icon}</span>
      <span
        className="text-white font-semibold tabular-nums"
        style={{ fontSize: '11px', lineHeight: 1, minWidth: '36px', display: 'inline-block' }}
      >
        {fmt(value)}
      </span>
    </div>
  )
}
