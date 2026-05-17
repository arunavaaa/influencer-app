'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

type Influencer = {
  id: string
  display_name: string
  bio: string
  city: string
  niche: string[]
  language: string[]
  reputation_score: number
}

const PLATFORMS = ['Instagram', 'YouTube', 'Moj', 'ShareChat']
const NICHES = ['Fashion', 'Food', 'Tech', 'Finance', 'Fitness', 'Travel', 'Beauty', 'Gaming', 'Parenting', 'Education', 'Lifestyle', 'Comedy']
const FOLLOWER_RANGES = ['Any', '1K–10K', '10K–50K', '50K–100K', '100K–500K', '500K+']
const SORT_OPTIONS = ['Top Rated', 'Newest', 'Price Low–High', 'Price High–Low']

const AVATAR_COLORS = [
  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
  { bg: 'bg-[#121511]', text: 'text-white' },
]

export default function DiscoverPage() {
  const supabase = createClient()
  const router = useRouter()

  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [selectedNiche, setSelectedNiche] = useState('')
  const [selectedFollowers, setSelectedFollowers] = useState('Any')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [sortBy, setSortBy] = useState('Top Rated')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInfluencers()
  }, [selectedPlatform])

  async function fetchInfluencers() {
    setLoading(true)
    let query = supabase
      .from('influencer_profiles')
      .select('id, display_name, bio, city, niche, language, reputation_score')
      .eq('is_profile_live', true)

    const { data, error } = await query
    if (!error) setInfluencers(data || [])
    setLoading(false)
  }

  function clearAll() {
    setSearch('')
    setSelectedPlatform(null)
    setSelectedNiche('')
    setSelectedFollowers('Any')
    setSelectedCity('')
    setSelectedLanguage('')
    setSortBy('Top Rated')
    fetchInfluencers()
  }

  const filtered = influencers.filter((inf) => {
    const matchSearch =
      search === '' ||
      inf.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      inf.city?.toLowerCase().includes(search.toLowerCase())
    const matchNiche =
      selectedNiche === '' || inf.niche?.includes(selectedNiche)
    const matchCity =
      selectedCity === '' ||
      inf.city?.toLowerCase().includes(selectedCity.toLowerCase())
    const matchLang =
      selectedLanguage === '' ||
      inf.language?.some((l) => l.toLowerCase().includes(selectedLanguage.toLowerCase()))
    return matchSearch && matchNiche && matchCity && matchLang
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Top Rated') return (b.reputation_score || 0) - (a.reputation_score || 0)
    return 0
  })

  function toggleSave(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSaved((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Page header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto">
          <h1 className="text-[30px] font-black text-[#121511]">Find Creators</h1>
          <p className="text-[16px] text-[#6A6C6A] mt-1">
            Discover verified Indian influencers across platforms
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-4 sticky top-16 z-30">
        <div className="max-w-[1360px] mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            {/* Platform pills */}
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(selectedPlatform === p ? null : p)}
                  className={`text-[14px] font-semibold px-4 py-2 rounded-full border transition-colors ${
                    selectedPlatform === p
                      ? 'bg-[#163300] text-white border-[#163300]'
                      : 'bg-white text-[#121511] border-[#E8E8E8] hover:border-[#163300]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-[#E8E8E8] hidden md:block" />

            {/* Category input */}
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="text-[14px] font-medium pl-4 pr-10 py-2 rounded-full border border-[#E8E8E8] bg-white text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
            >
              <option value="">Any Category</option>
              {NICHES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Followers */}
            <select
              value={selectedFollowers}
              onChange={(e) => setSelectedFollowers(e.target.value)}
              className="text-[14px] font-medium pl-4 pr-10 py-2 rounded-full border border-[#E8E8E8] bg-white text-[#121511] focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
            >
              {FOLLOWER_RANGES.map((f) => (
                <option key={f} value={f}>{f} followers</option>
              ))}
            </select>

            {/* City */}
            <input
              type="text"
              placeholder="City..."
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-[14px] px-4 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] w-28"
            />

            {/* Language */}
            <input
              type="text"
              placeholder="Language..."
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-[14px] px-4 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] w-28"
            />

            <button
              onClick={clearAll}
              className="text-[14px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors"
            >
              Clear All
            </button>

            {/* Sort — pushed right */}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[14px] text-[#6A6C6A]">{sorted.length} creators found</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[14px] font-medium pl-4 pr-10 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 text-[15px] px-5 py-2.5 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300]"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
              <p className="text-[16px] text-[#6A6C6A]">Finding creators...</p>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-[24px] font-bold text-[#121511] mb-2">No creators found</p>
            <p className="text-[16px] text-[#6A6C6A]">Try adjusting your filters or clearing them.</p>
            <button
              onClick={clearAll}
              className="mt-6 bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[30px]">
            {sorted.map((influencer, i) => {
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const isSaved = saved.has(influencer.id)

              return (
                <div
                  key={influencer.id}
                  className="bg-white rounded-[24px] p-[20px] hover:-translate-y-1 transition-transform cursor-pointer relative group"
                  onClick={() => router.push(`/influencer/${influencer.id}`)}
                >
                  {/* Save button */}
                  <button
                    onClick={(e) => toggleSave(influencer.id, e)}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#EDEFEB] transition-colors z-10"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        isSaved ? 'fill-red-500 stroke-red-500' : 'stroke-[#6A6C6A]'
                      }`}
                    />
                  </button>

                  {/* Avatar */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-4 ${color.bg} ${color.text}`}
                  >
                    {influencer.display_name?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Name + city */}
                  <h3 className="text-[20px] font-bold text-[#121511] tracking-tight mb-0.5 pr-8">
                    {influencer.display_name || 'Creator'}
                  </h3>
                  <p className="text-[14px] text-[#6A6C6A] mb-3">
                    {influencer.city || 'India'}
                  </p>

                  {/* Niche badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {influencer.niche?.slice(0, 3).map((n) => (
                      <span
                        key={n}
                        className="text-[12px] px-2.5 py-1 bg-[#EDEFEB] text-[#163300] font-medium rounded-full"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between py-3 border-t border-[#E8E8E8] mb-4">
                    <div className="text-center">
                      <p className="text-[12px] text-[#6A6C6A]">Score</p>
                      <p className="text-[16px] font-bold text-[#121511]">
                        {influencer.reputation_score || '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] text-[#6A6C6A]">Languages</p>
                      <p className="text-[14px] font-semibold text-[#121511]">
                        {influencer.language?.slice(0, 2).join(', ') || '—'}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="w-full border-2 border-[#163300] text-[#163300] font-bold text-[14px] py-2.5 rounded-full hover:bg-[#163300] hover:text-[#9FE870] transition-colors">
                    View Profile
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
