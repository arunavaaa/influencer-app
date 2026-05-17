'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const PLATFORMS = ['Instagram', 'YouTube', 'Moj', 'ShareChat']

const POPULAR_CATEGORIES = [
  'Lifestyle', 'Fashion', 'Beauty & Skincare', 'Food & Drink',
  'Health & Fitness', 'Comedy & Entertainment',
]

const MORE_CATEGORIES = [
  'Finance & Investing', 'Technology', 'Travel', 'Education',
  'Music & Dance', 'Parenting', 'Sports & Cricket', 'Gaming',
  'Entrepreneurship', 'Art & Photography', 'Home Decor', 'Automotive',
  'Wedding & Bridal', 'Animals & Pets', 'Sustainable Living',
  'Astrology & Spirituality', 'Saree & Ethnic Wear', 'Regional Content',
]

function PillBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[14px] font-semibold border transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#163300] text-white border-[#163300]'
          : 'bg-white text-[#121511] border-[#E0E0E0] hover:border-[#163300]'
      }`}
    >
      {label}
    </button>
  )
}

export function HeroSearch() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [platform, setPlatform] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [platformOpen, setPlatformOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPlatformOpen(false)
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleCategory(cat: string) {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function categoryLabel() {
    if (categories.length === 0) return null
    const shown = categories.slice(0, 2).join(', ')
    const extra = categories.length > 2 ? `, +${categories.length - 2}` : ''
    return shown + extra
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (platform) params.set('platform', platform.toLowerCase())
    if (categories.length > 0) params.set('category', categories[0])
    router.push(`/brand/discover${params.toString() ? '?' + params.toString() : ''}`)
  }

  const catLabel = categoryLabel()

  return (
    <div ref={containerRef} className="relative max-w-[640px] mx-auto">
      {/* Bar */}
      <div className="bg-white rounded-2xl flex items-stretch shadow-lg overflow-visible">
        {/* Platform panel */}
        <button
          onClick={() => { setPlatformOpen(v => !v); setCategoryOpen(false) }}
          className="flex-1 text-left px-5 py-4 border-r border-[#EBEBEB] rounded-l-2xl hover:bg-[#FAFAFA] transition-colors"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#163300]">Platform</p>
          <p className={`text-[15px] mt-0.5 font-medium ${platform ? 'text-[#121511]' : 'text-[#9A9C9A]'}`}>
            {platform ?? 'Any platform'}
          </p>
        </button>

        {/* Category panel */}
        <button
          onClick={() => { setCategoryOpen(v => !v); setPlatformOpen(false) }}
          className="flex-[1.5] text-left px-5 py-4 hover:bg-[#FAFAFA] transition-colors"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#163300]">Category</p>
          <p className={`text-[15px] mt-0.5 font-medium truncate ${catLabel ? 'text-[#121511]' : 'text-[#9A9C9A]'}`}>
            {catLabel ?? 'All categories'}
          </p>
        </button>

        {/* Search button */}
        <div className="flex items-center pr-2 pl-1">
          <button
            onClick={handleSearch}
            className="w-12 h-12 rounded-xl bg-[#121511] hover:bg-[#163300] transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Search creators"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Platform dropdown */}
      {platformOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white rounded-2xl shadow-2xl border border-[#EBEBEB] p-5 z-50">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6A6C6A] mb-3">Select Platform</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <PillBtn
                key={p}
                label={p}
                active={platform === p}
                onClick={() => { setPlatform(platform === p ? null : p); setPlatformOpen(false) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category dropdown */}
      {categoryOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-[#EBEBEB] p-5 z-50 max-h-[420px] overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6A6C6A] mb-3">Popular</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {POPULAR_CATEGORIES.map(cat => (
              <PillBtn
                key={cat}
                label={cat}
                active={categories.includes(cat)}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6A6C6A] mb-3">More Categories</p>
          <div className="flex flex-wrap gap-2">
            {MORE_CATEGORIES.map(cat => (
              <PillBtn
                key={cat}
                label={cat}
                active={categories.includes(cat)}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
          {categories.length > 0 && (
            <button
              onClick={() => setCategories([])}
              className="mt-4 text-[13px] text-[#6A6C6A] hover:text-red-500 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
