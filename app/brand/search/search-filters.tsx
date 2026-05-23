'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NICHES, CITIES, LANGUAGES } from '@/lib/types'
import { Suspense } from 'react'

function Filters() {
  const router = useRouter()
  const sp = useSearchParams()
  const [niche, setNiche] = useState(sp.get('niche') ?? '')
  const [city, setCity] = useState(sp.get('city') ?? '')
  const [language, setLanguage] = useState(sp.get('language') ?? '')
  const [minFollowers, setMinFollowers] = useState(sp.get('min_followers') ?? '')

  function apply() {
    const params = new URLSearchParams()
    if (niche) params.set('niche', niche)
    if (city) params.set('city', city)
    if (language) params.set('language', language)
    if (minFollowers) params.set('min_followers', minFollowers)
    router.push(`/brand/search?${params.toString()}`)
  }

  function clear() { setNiche(''); setCity(''); setLanguage(''); setMinFollowers(''); router.push('/brand/search') }

  const S = 'px-3 py-2 rounded-[12px] border border-[#163300]/20 bg-white text-[14px] text-[#121511] focus:outline-none focus:border-[#163300] transition-colors'

  return (
    <div className="bg-white rounded-[20px] p-4 flex flex-wrap gap-3 items-end">
      <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#6A6C6A] mb-1">Niche</label><select className={S} value={niche} onChange={e => setNiche(e.target.value)}><option value="">All niches</option>{NICHES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
      <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#6A6C6A] mb-1">City</label><select className={S} value={city} onChange={e => setCity(e.target.value)}><option value="">All cities</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
      <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#6A6C6A] mb-1">Language</label><select className={S} value={language} onChange={e => setLanguage(e.target.value)}><option value="">Any language</option>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
      <div><label className="block text-[11px] font-bold uppercase tracking-widest text-[#6A6C6A] mb-1">Min Followers</label><input className={S} type="number" placeholder="e.g. 10000" value={minFollowers} onChange={e => setMinFollowers(e.target.value)} /></div>
      <div className="flex gap-2">
        <button onClick={apply} className="px-5 py-2 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">Search</button>
        {(niche || city || language || minFollowers) && <button onClick={clear} className="px-4 py-2 text-[13px] font-semibold text-[#6A6C6A] hover:text-[#121511] transition-colors">Clear</button>}
      </div>
    </div>
  )
}

export function SearchFilters() {
  return <Suspense><Filters /></Suspense>
}
