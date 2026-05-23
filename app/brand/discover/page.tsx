'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Loader2, Lock, ChevronDown } from 'lucide-react'
import { UpgradeModal } from '@/components/shared/UpgradeModal'

type SocialAccount = {
  follower_count: number | null
  engagement_rate: number | null
}

type Influencer = {
  id: string
  display_name: string
  bio: string | null
  city: string | null
  niche: string[] | null
  language: string[] | null
  reputation_score: number | null
  profile_photo_url: string | null
  social_accounts: SocialAccount[] | null
}

const NICHES = ['Fashion', 'Food', 'Tech', 'Finance', 'Fitness', 'Travel', 'Beauty', 'Gaming', 'Parenting', 'Education', 'Lifestyle', 'Comedy']

const FOLLOWER_RANGES = [
  { label: 'Any size', min: null, max: null },
  { label: 'Nano (1K–10K)', min: 1_000, max: 10_000 },
  { label: 'Micro (10K–50K)', min: 10_000, max: 50_000 },
  { label: 'Mid (50K–100K)', min: 50_000, max: 100_000 },
  { label: 'Macro (100K–500K)', min: 100_000, max: 500_000 },
  { label: 'Mega (500K+)', min: 500_000, max: null },
]

const SORT_OPTIONS = ['Top Rated', 'Most Followers', 'Newest']

const AVATAR_COLORS = [
  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
  { bg: 'bg-[#121511]', text: 'text-white' },
]

function fmtFollowers(n: number | null) {
  if (!n) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

export default function DiscoverPage() {
  const supabase = createClient()

  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [selectedFollowers, setSelectedFollowers] = useState(0)
  const [selectedCity, setSelectedCity] = useState('')
  const [sortBy, setSortBy] = useState('Top Rated')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => { fetchInfluencers() }, [])

  async function fetchInfluencers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('influencer_profiles')
      .select('id, display_name, bio, city, niche, language, reputation_score, profile_photo_url, social_accounts(follower_count, engagement_rate)')
      .eq('is_profile_live', true)
    if (!error) setInfluencers(data || [])
    setLoading(false)
  }

  function clearAll() {
    setSearch('')
    setSelectedNiche('')
    setSelectedFollowers(0)
    setSelectedCity('')
    setSortBy('Top Rated')
  }

  const filtered = influencers.filter((inf) => {
    const matchSearch = search === '' ||
      inf.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      inf.city?.toLowerCase().includes(search.toLowerCase())
    const matchNiche = selectedNiche === '' || inf.niche?.includes(selectedNiche)
    const matchCity = selectedCity === '' ||
      inf.city?.toLowerCase().includes(selectedCity.toLowerCase())
    const range = FOLLOWER_RANGES[selectedFollowers]
    const followers = inf.social_accounts?.[0]?.follower_count || 0
    const matchFollowers = selectedFollowers === 0 ||
      (range.min === null || followers >= range.min) &&
      (range.max === null || followers <= range.max)
    return matchSearch && matchNiche && matchCity && matchFollowers
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Top Rated') return (b.reputation_score || 0) - (a.reputation_score || 0)
    if (sortBy === 'Most Followers') return (b.social_accounts?.[0]?.follower_count || 0) - (a.social_accounts?.[0]?.follower_count || 0)
    return 0
  })

  const anyFilterActive = search !== '' || selectedNiche !== '' || selectedFollowers !== 0 || selectedCity !== ''

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {showUpgrade && <UpgradeModal trigger="filters" onClose={() => setShowUpgrade(false)} />}

      {/* Page header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto">
          <h1 className="text-[30px] font-black text-[#121511]">Find Creators</h1>
          <p className="text-[15px] text-[#6A6C6A] mt-1">Discover verified Indian creators across every niche</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-4 sticky top-16 z-30">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
            <input
              type="text"
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-full border border-[#E8E8E8] bg-white text-[14px] focus:outline-none focus:border-[#163300] w-52"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="text-[14px] font-medium pl-4 pr-8 py-2 rounded-full border border-[#E8E8E8] bg-white text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
            >
              <option value="">Any Category</option>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A6C6A] pointer-events-none" />
          </div>

          {/* Followers */}
          <div className="relative">
            <select
              value={selectedFollowers}
              onChange={(e) => setSelectedFollowers(Number(e.target.value))}
              className="text-[14px] font-medium pl-4 pr-8 py-2 rounded-full border border-[#E8E8E8] bg-white text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
            >
              {FOLLOWER_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A6C6A] pointer-events-none" />
          </div>

          {/* City */}
          <input
            type="text"
            placeholder="City..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-[14px] px-4 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] w-28"
          />

          {/* Pro filter chips */}
          {['Engagement Rate', 'Verified only'].map(label => (
            <button
              key={label}
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-1.5 text-[14px] font-semibold px-4 py-2 rounded-full border border-dashed border-[#163300]/30 text-[#6A6C6A] hover:border-[#163300] hover:text-[#163300] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}

          {anyFilterActive && (
            <button
              onClick={clearAll}
              className="text-[14px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors"
            >
              Clear
            </button>
          )}

          {/* Count + sort — pushed right */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[14px] text-[#6A6C6A]">{sorted.length} creators</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[14px] font-medium pl-4 pr-8 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
              >
                {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A6C6A] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#163300]" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[22px] font-black text-[#121511] mb-2">No creators found</p>
            <p className="text-[15px] text-[#6A6C6A]">Try adjusting your filters.</p>
            <button
              onClick={clearAll}
              className="mt-6 bg-[#9FE870] text-[#163300] font-bold text-[14px] px-8 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sorted.map((inf, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const ig = inf.social_accounts?.[0]
              const followers = fmtFollowers(ig?.follower_count ?? null)
              const engRate = ig?.engagement_rate
                ? `${ig.engagement_rate.toFixed(1)}%`
                : null

              return (
                <Link
                  key={inf.id}
                  href={`/brand/creators/${inf.id}`}
                  className="bg-white rounded-[24px] overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  {/* Photo area */}
                  <div className="h-[180px] overflow-hidden">
                    {inf.profile_photo_url ? (
                      <img src={inf.profile_photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-[52px] font-black ${color.bg} ${color.text}`}>
                        {inf.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="text-[17px] font-black text-[#121511] leading-tight mb-0.5">
                      {inf.display_name || 'Creator'}
                    </h3>
                    {inf.city && (
                      <p className="text-[13px] text-[#6A6C6A] mb-3">{inf.city}</p>
                    )}

                    {/* Niche badges */}
                    {inf.niche && inf.niche.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {inf.niche.slice(0, 2).map(n => (
                          <span key={n} className="text-[11px] px-2.5 py-0.5 bg-[#EDEFEB] text-[#163300] font-semibold rounded-full">
                            {n}
                          </span>
                        ))}
                        {inf.niche.length > 2 && (
                          <span className="text-[11px] px-2.5 py-0.5 bg-[#EDEFEB] text-[#6A6C6A] font-semibold rounded-full">
                            +{inf.niche.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 py-3 border-t border-[#E8E8E8]">
                      {followers ? (
                        <div>
                          <p className="text-[15px] font-black text-[#121511]">{followers}</p>
                          <p className="text-[11px] text-[#6A6C6A]">Followers</p>
                        </div>
                      ) : null}
                      {engRate ? (
                        <div>
                          <p className="text-[15px] font-black text-[#121511]">{engRate}</p>
                          <p className="text-[11px] text-[#6A6C6A]">Engagement</p>
                        </div>
                      ) : null}
                      {!followers && !engRate && (
                        <p className="text-[12px] text-[#B0B2AF]">Stats not yet available</p>
                      )}
                    </div>

                    <div className="mt-3 w-full text-center text-[13px] font-bold text-[#163300] py-2 rounded-[10px] bg-[#EDEFEB] hover:bg-[#9FE870] transition-colors">
                      View Profile
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
