'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calculator, IndianRupee } from 'lucide-react'

const PLATFORMS = ['Instagram', 'YouTube', 'Moj', 'ShareChat']
const NICHES = ['Fashion', 'Food', 'Tech', 'Finance', 'Fitness', 'Travel', 'Beauty', 'Gaming', 'Parenting', 'Education', 'Lifestyle', 'Comedy']
const FOLLOWER_RANGES = [
  { label: '1K – 10K', min: 1000, max: 10000, multiplier: 0.5 },
  { label: '10K – 50K', min: 10000, max: 50000, multiplier: 1 },
  { label: '50K – 100K', min: 50000, max: 100000, multiplier: 2 },
  { label: '100K – 500K', min: 100000, max: 500000, multiplier: 4 },
  { label: '500K – 1M', min: 500000, max: 1000000, multiplier: 8 },
  { label: '1M+', min: 1000000, max: Infinity, multiplier: 15 },
]

const BASE_PRICES: Record<string, number> = {
  instagram: 5000,
  youtube: 8000,
  moj: 2000,
  sharechat: 1500,
}

const NICHE_MULTIPLIERS: Record<string, number> = {
  Tech: 1.5,
  Finance: 1.6,
  Fashion: 1.3,
  Beauty: 1.3,
  Gaming: 1.2,
  Travel: 1.2,
  Fitness: 1.1,
  Food: 1.1,
  Lifestyle: 1.0,
  Comedy: 0.9,
  Parenting: 0.9,
  Education: 1.0,
}

type SimilarCreator = {
  id: string
  display_name: string
  city: string
  niche: string[]
}

export default function PriceCalculatorPage() {
  const supabase = createClient()
  const [platform, setPlatform] = useState('instagram')
  const [niche, setNiche] = useState('Fashion')
  const [followerRange, setFollowerRange] = useState(1)
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [similarCreators, setSimilarCreators] = useState<SimilarCreator[]>([])

  useEffect(() => {
    const base = BASE_PRICES[platform.toLowerCase()] || 5000
    const range = FOLLOWER_RANGES[followerRange]
    const nicheMultiplier = NICHE_MULTIPLIERS[niche] || 1.0
    const price = Math.round(base * range.multiplier * nicheMultiplier / 1000) * 1000

    setEstimatedPrice(price)
    fetchSimilarCreators()
  }, [platform, niche, followerRange])

  async function fetchSimilarCreators() {
    const { data } = await supabase
      .from('influencer_profiles')
      .select('id, display_name, city, niche')
      .eq('is_profile_live', true)
      .contains('niche', [niche])
      .limit(4)

    setSimilarCreators(data || [])
  }

  const minPrice = Math.round(estimatedPrice * 0.7 / 500) * 500
  const maxPrice = Math.round(estimatedPrice * 1.4 / 500) * 500

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <section className="bg-[#163300] px-5 md:px-[70px] py-[60px]">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="w-14 h-14 bg-[#9FE870] rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-7 h-7 text-[#163300]" />
          </div>
          <h1 className="text-[48px] font-black text-[#9FE870] uppercase leading-tight mb-4">
            Influencer Price Calculator
          </h1>
          <p className="text-[18px] text-white/80 max-w-lg mx-auto">
            Find out how much Indian influencers charge — free tool, no sign-up needed.
          </p>
        </div>
      </section>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator */}
          <div className="bg-white rounded-[24px] p-8">
            <h2 className="text-[20px] font-black text-[#121511] mb-6">Configure</h2>

            {/* Platform */}
            <div className="mb-6">
              <label className="text-[14px] font-bold text-[#121511] mb-3 block">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p.toLowerCase())}
                    className={`py-3 px-4 rounded-[12px] text-[15px] font-semibold border-2 transition-colors ${
                      platform === p.toLowerCase()
                        ? 'border-[#163300] bg-[#163300] text-[#9FE870]'
                        : 'border-[#E8E8E8] text-[#121511] hover:border-[#163300]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Niche */}
            <div className="mb-6">
              <label className="text-[14px] font-bold text-[#121511] mb-3 block">Niche / Category</label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNiche(n)}
                    className={`text-[13px] font-semibold px-3 py-1.5 rounded-full border-2 transition-colors ${
                      niche === n
                        ? 'border-[#163300] bg-[#163300] text-[#9FE870]'
                        : 'border-[#E8E8E8] text-[#121511] hover:border-[#163300]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Follower range */}
            <div className="mb-6">
              <label className="text-[14px] font-bold text-[#121511] mb-3 block">
                Followers — <span className="font-normal text-[#6A6C6A]">{FOLLOWER_RANGES[followerRange].label}</span>
              </label>
              <input
                type="range"
                min={0}
                max={FOLLOWER_RANGES.length - 1}
                value={followerRange}
                onChange={(e) => setFollowerRange(parseInt(e.target.value))}
                className="w-full accent-[#163300]"
              />
              <div className="flex justify-between text-[12px] text-[#6A6C6A] mt-1">
                <span>1K</span>
                <span>10K</span>
                <span>50K</span>
                <span>100K</span>
                <span>500K</span>
                <span>1M+</span>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-5">
            {/* Estimate card */}
            <div className="bg-[#163300] rounded-[24px] p-8 text-center">
              <p className="text-[14px] font-semibold text-white/70 mb-3 uppercase tracking-wider">
                Estimated Price Range
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <IndianRupee className="w-8 h-8 text-[#9FE870]" />
                <p className="text-[48px] font-black text-[#9FE870]">
                  {estimatedPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <p className="text-[16px] text-white/60">
                ₹{minPrice.toLocaleString('en-IN')} — ₹{maxPrice.toLocaleString('en-IN')}
              </p>
              <p className="text-[13px] text-white/50 mt-2">per content piece</p>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="bg-white/10 rounded-[12px] p-4">
                  <p className="text-[12px] text-white/60 mb-1">Platform</p>
                  <p className="text-[15px] font-bold text-white capitalize">{platform}</p>
                </div>
                <div className="bg-white/10 rounded-[12px] p-4">
                  <p className="text-[12px] text-white/60 mb-1">Niche</p>
                  <p className="text-[15px] font-bold text-white">{niche}</p>
                </div>
                <div className="bg-white/10 rounded-[12px] p-4 col-span-2">
                  <p className="text-[12px] text-white/60 mb-1">Follower Range</p>
                  <p className="text-[15px] font-bold text-white">{FOLLOWER_RANGES[followerRange].label}</p>
                </div>
              </div>

              <Link
                href="/brand/discover"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[16px] py-4 rounded-full hover:bg-[#8fdc60] transition-colors"
              >
                Find Similar Creators →
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="bg-white rounded-[24px] p-5">
              <p className="text-[13px] text-[#6A6C6A] leading-relaxed">
                <strong className="text-[#121511]">Note:</strong> Estimates are based on average Indian influencer market rates. Actual prices vary based on engagement rate, content quality, exclusivity, and individual negotiation. Use this as a starting point for budget planning.
              </p>
            </div>
          </div>
        </div>

        {/* Similar creators */}
        {similarCreators.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[25px] font-black text-[#121511] mb-6">
              Similar Creators on Crayon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {similarCreators.map((c, i) => {
                const colors = [
                  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
                  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
                  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
                  { bg: 'bg-[#121511]', text: 'text-white' },
                ][i % 4]
                return (
                  <Link key={c.id} href={`/influencer/${c.id}`}>
                    <div className="bg-white rounded-[24px] p-5 hover:-translate-y-1 transition-transform cursor-pointer">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mb-3 ${colors.bg} ${colors.text}`}>
                        {c.display_name?.[0]?.toUpperCase()}
                      </div>
                      <h3 className="text-[15px] font-bold text-[#121511] mb-0.5">{c.display_name}</h3>
                      <p className="text-[13px] text-[#6A6C6A] mb-2">{c.city || 'India'}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.niche?.slice(0, 2).map((n) => (
                          <span key={n} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#163300] rounded-full font-medium">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
