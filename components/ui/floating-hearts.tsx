'use client'
import { useEffect, useState, useRef } from 'react'

// All shades of Instagram-red — no other colours
const REDS = ['#FF2D55', '#FF0040', '#FF3040', '#FF1744']
const ANIMS = ['floatHeartA', 'floatHeartB', 'floatHeartC']

interface Particle {
  id: number
  x: number        // % from left
  y: number        // % from bottom
  color: string
  size: number     // px
  duration: number // ms
  anim: string
  driftX: number   // px  — CSS var --hx
  opacity: number  // starting opacity — CSS var --ho
}

let uid = 0

export function FloatingHearts({ layer = 'back' }: { layer?: 'back' | 'front' }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isBack = layer === 'back'

  // back layer: many hearts, faster spawn, smaller, dimmer
  // front layer: few hearts ("bypass gap" ones), slower spawn, slightly bigger, more opaque
  const cap       = isBack ? 14 : 6
  const minDelay  = isBack ? 220 : 800
  const rngDelay  = isBack ? 320 : 800
  const minSize   = isBack ? 11  : 16
  const rngSize   = isBack ? 10  : 10
  const minOp     = isBack ? 0.62 : 0.88
  const rngOp     = isBack ? 0.20 : 0.10
  const zIndex    = isBack ? 2    : 8

  useEffect(() => {
    const spawn = () => {
      // back layer: occasional bursts of 2-3; front: always single
      const count = isBack
        ? (Math.random() > 0.70 ? (Math.random() > 0.45 ? 3 : 2) : 1)
        : 1

      setParticles(prev => {
        if (prev.length >= cap) return prev
        const next = [...prev]
        for (let i = 0; i < count && next.length < cap; i++) {
          next.push({
            id:       uid++,
            x:        5 + Math.random() * 90,
            y:        2 + Math.random() * 20,   // spawn within image-strip zone
            color:    REDS[Math.floor(Math.random() * REDS.length)],
            size:     minSize + Math.random() * rngSize,
            duration: 2800 + Math.random() * 1600,
            anim:     ANIMS[Math.floor(Math.random() * ANIMS.length)],
            driftX:   (Math.random() - 0.5) * 52,
            opacity:  minOp + Math.random() * rngOp,
          })
        }
        return next
      })

      timerRef.current = setTimeout(spawn, minDelay + Math.random() * rngDelay)
    }

    timerRef.current = setTimeout(spawn, isBack ? 500 : 1400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isBack, cap, minDelay, rngDelay, minSize, rngSize, minOp, rngOp])

  const remove = (id: number) =>
    setParticles(prev => prev.filter(p => p.id !== id))

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none"
      style={{ zIndex }}
    >
      {particles.map(p => (
        <span
          key={p.id}
          onAnimationEnd={() => remove(p.id)}
          style={{
            position:   'absolute',
            bottom:     `${p.y}%`,
            left:       `${p.x}%`,
            fontSize:   `${p.size}px`,
            color:      p.color,
            lineHeight: 1,
            animation:  `${p.anim} ${p.duration}ms ease-out forwards`,
            '--hx':     `${p.driftX}px`,
            '--ho':     String(p.opacity),
            willChange: 'transform, opacity',
          } as React.CSSProperties}
        >
          ♥
        </span>
      ))}
    </div>
  )
}
