'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { NICHES, CITIES, LANGUAGES, FOLLOWER_RANGES } from '@/lib/types'

const PLATFORMS = ['Instagram', 'YouTube', 'X', 'Facebook', 'LinkedIn']

const FOLLOWER_OPTIONS = [
  { label: 'Any', value: '' },
  ...FOLLOWER_RANGES.map(r => ({ label: r.label, value: r.value })),
]

function displayLabel(selected: string[], placeholder: string) {
  if (!selected.length) return placeholder
  if (selected.length === 1) return selected[0]
  if (selected.length === 2) return `${selected[0]}, ${selected[1]}`
  return `${selected[0]}, ${selected[1]}...+${selected.length - 2}`
}

function Filters() {
  const router = useRouter()
  const sp = useSearchParams()

  const [niches, setNiches] = useState<string[]>(sp.get('niche')?.split(',').filter(Boolean) ?? [])
  const [cities, setCities] = useState<string[]>(sp.get('city')?.split(',').filter(Boolean) ?? [])
  const [languages, setLanguages] = useState<string[]>(sp.get('language')?.split(',').filter(Boolean) ?? [])
  const [followers, setFollowers] = useState(sp.get('followers') ?? '')
  const [platforms, setPlatforms] = useState<string[]>(sp.get('platform')?.split(',').filter(Boolean) ?? [])
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function toggle(id: string) { setOpen(prev => prev === id ? null : id) }

  function toggleItem(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  function apply() {
    const params = new URLSearchParams()
    if (niches.length) params.set('niche', niches.join(','))
    if (cities.length) params.set('city', cities.join(','))
    if (languages.length) params.set('language', languages.join(','))
    if (followers) params.set('followers', followers)
    if (platforms.length) params.set('platform', platforms.join(','))
    router.push(`/brand/search?${params.toString()}`)
    setOpen(null)
  }

  function clear() {
    setNiches([]); setCities([]); setLanguages([]); setFollowers(''); setPlatforms([])
    router.push('/brand/search')
  }

  const hasFilters = !!(niches.length || cities.length || languages.length || followers || platforms.length)

  const followerLabel = FOLLOWER_OPTIONS.find(o => o.value === followers)?.label ?? 'Any'

  function fieldCls(id: string, hasValue: boolean) {
    return `w-full flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-[14px] border-2 cursor-pointer select-none transition-all ${
      open === id
        ? 'border-[#163300] bg-white'
        : hasValue
        ? 'border-[#163300]/40 bg-white text-[#163300]'
        : 'border-[#E8E8E8] bg-[#F8F9F7] hover:border-[#163300]/30'
    }`
  }

  return (
    <div ref={ref} className="bg-white rounded-[20px] p-3">
      <div className="flex gap-2 items-center">

        {/* Niche */}
        <div className="flex-1 relative min-w-0">
          <div className={fieldCls('niche', !!niches.length)} onClick={() => toggle('niche')}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] leading-none mb-1">Niche</p>
              <p className="text-[13px] font-semibold text-[#121511] truncate">{displayLabel(niches, 'All niches')}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9A9C9A] flex-shrink-0 transition-transform duration-150 ${open === 'niche' ? 'rotate-180' : ''}`} />
          </div>
          {open === 'niche' && (
            <DropdownPanel>
              {NICHES.map(n => <CheckItem key={n} label={n} checked={niches.includes(n)} onToggle={() => toggleItem(niches, n, setNiches)} />)}
            </DropdownPanel>
          )}
        </div>

        {/* City */}
        <div className="flex-1 relative min-w-0">
          <div className={fieldCls('city', !!cities.length)} onClick={() => toggle('city')}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] leading-none mb-1">City</p>
              <p className="text-[13px] font-semibold text-[#121511] truncate">{displayLabel(cities, 'All cities')}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9A9C9A] flex-shrink-0 transition-transform duration-150 ${open === 'city' ? 'rotate-180' : ''}`} />
          </div>
          {open === 'city' && (
            <DropdownPanel>
              {CITIES.map(c => <CheckItem key={c} label={c} checked={cities.includes(c)} onToggle={() => toggleItem(cities, c, setCities)} />)}
            </DropdownPanel>
          )}
        </div>

        {/* Language */}
        <div className="flex-1 relative min-w-0">
          <div className={fieldCls('language', !!languages.length)} onClick={() => toggle('language')}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] leading-none mb-1">Language</p>
              <p className="text-[13px] font-semibold text-[#121511] truncate">{displayLabel(languages, 'Any language')}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9A9C9A] flex-shrink-0 transition-transform duration-150 ${open === 'language' ? 'rotate-180' : ''}`} />
          </div>
          {open === 'language' && (
            <DropdownPanel>
              {LANGUAGES.map(l => <CheckItem key={l} label={l} checked={languages.includes(l)} onToggle={() => toggleItem(languages, l, setLanguages)} />)}
            </DropdownPanel>
          )}
        </div>

        {/* Followers */}
        <div className="flex-1 relative min-w-0">
          <div className={fieldCls('followers', !!followers)} onClick={() => toggle('followers')}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] leading-none mb-1">Followers</p>
              <p className="text-[13px] font-semibold text-[#121511] truncate">{followerLabel}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9A9C9A] flex-shrink-0 transition-transform duration-150 ${open === 'followers' ? 'rotate-180' : ''}`} />
          </div>
          {open === 'followers' && (
            <DropdownPanel>
              {FOLLOWER_OPTIONS.map(({ label, value }) => (
                <div key={label} onClick={() => { setFollowers(value); setOpen(null) }}
                  className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-[8px] cursor-pointer hover:bg-[#EDEFEB] transition-colors`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${followers === value ? 'border-[#163300] bg-[#163300]' : 'border-[#D0D0D0]'}`}>
                    {followers === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-[13px] ${followers === value ? 'font-bold text-[#163300]' : 'font-semibold text-[#4A4C4A]'}`}>{label}</span>
                </div>
              ))}
            </DropdownPanel>
          )}
        </div>

        {/* Platform */}
        <div className="flex-1 relative min-w-0">
          <div className={fieldCls('platform', !!platforms.length)} onClick={() => toggle('platform')}>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9A9C9A] leading-none mb-1">Platform</p>
              <p className="text-[13px] font-semibold text-[#121511] truncate">{displayLabel(platforms, 'Any platform')}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#9A9C9A] flex-shrink-0 transition-transform duration-150 ${open === 'platform' ? 'rotate-180' : ''}`} />
          </div>
          {open === 'platform' && (
            <DropdownPanel>
              {PLATFORMS.map(p => <CheckItem key={p} label={p} checked={platforms.includes(p)} onToggle={() => toggleItem(platforms, p, setPlatforms)} />)}
            </DropdownPanel>
          )}
        </div>

        {/* Actions */}
        <button onClick={apply}
          className="bg-[#163300] text-[#9FE870] rounded-full hover:bg-[#1f4a00] transition-colors flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center">
          <Search className="w-5 h-5" />
        </button>
        {hasFilters && (
          <button onClick={clear} className="text-[13px] font-semibold text-[#9A9C9A] hover:text-[#121511] transition-colors flex-shrink-0 px-1">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E8E8E8] rounded-[16px] shadow-xl z-50 py-1.5 max-h-[260px] overflow-y-auto">
      {children}
    </div>
  )
}

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle}
      className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded-[8px] cursor-pointer hover:bg-[#EDEFEB] transition-colors">
      <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'border-[#163300] bg-[#163300]' : 'border-[#D0D0D0]'}`}>
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <span className={`text-[13px] ${checked ? 'font-bold text-[#163300]' : 'font-semibold text-[#4A4C4A]'}`}>{label}</span>
    </div>
  )
}

export function SearchFilters() {
  return <Suspense><Filters /></Suspense>
}
