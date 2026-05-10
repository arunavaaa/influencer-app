'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Heart, Share2, MapPin, Star } from 'lucide-react'

type Profile = {
  id: string
  display_name: string
  bio: string
  city: string
  niche: string[]
  language: string[]
  reputation_score: number
}

type Package = {
  id: string
  format: string
  platform: string
  price_inr: number
  delivery_days: number
  revisions_allowed: number
  description: string
}

type Review = {
  id: string
  rating_overall: number
  rating_communication: number
  rating_timeliness: number
  rating_satisfaction: number
  text: string
  created_at: string
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  youtube: 'bg-red-100 text-red-700',
  moj: 'bg-purple-100 text-purple-700',
  sharechat: 'bg-yellow-100 text-yellow-700',
}

const FORMAT_LABEL: Record<string, string> = {
  reel: 'Reel',
  post: 'Post',
  story: 'Story',
  ugc: 'UGC',
  youtube_video: 'YouTube Video',
  youtube_short: 'YouTube Short',
}

function StarBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[14px] text-[#6A6C6A] w-32">{label}</span>
      <div className="flex-1 bg-[#EDEFEB] rounded-full h-2">
        <div
          className="bg-[#9FE870] h-2 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-[14px] font-bold text-[#121511] w-8 text-right">
        {value ? value.toFixed(1) : '—'}
      </span>
    </div>
  )
}

export default function InfluencerProfilePage() {
  const supabase = createClient()
  const { id } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [similarCreators, setSimilarCreators] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    const { data: profileData } = await supabase
      .from('influencer_profiles')
      .select('id, display_name, bio, city, niche, language, reputation_score')
      .eq('id', id as string)
      .single()

    if (profileData) {
      setProfile(profileData)

      const [{ data: pkgs }, { data: revs }, { data: similar }] = await Promise.all([
        supabase
          .from('content_packages')
          .select('*')
          .eq('influencer_id', profileData.id)
          .eq('is_active', true),
        supabase
          .from('reviews')
          .select('*')
          .eq('influencer_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('influencer_profiles')
          .select('id, display_name, bio, city, niche, language, reputation_score')
          .eq('is_profile_live', true)
          .neq('id', profileData.id)
          .limit(4),
      ])

      setPackages(pkgs || [])
      setReviews(revs || [])
      setSimilarCreators(similar || [])
      if (pkgs && pkgs.length > 0) setSelectedPackage(pkgs[0])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEFEB]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
          <p className="text-[16px] text-[#6A6C6A]">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEFEB]">
        <div className="text-center">
          <p className="text-[24px] font-bold text-[#121511] mb-2">Creator not found</p>
          <button
            onClick={() => router.back()}
            className="text-[16px] text-[#163300] font-semibold hover:opacity-70"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length
      : 0
  const avgComm =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating_communication || 0), 0) / reviews.length
      : 0
  const avgTime =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating_timeliness || 0), 0) / reviews.length
      : 0
  const avgSat =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating_satisfaction || 0), 0) / reviews.length
      : 0

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* ── HERO ── */}
      <section className="bg-[#163300] px-5 md:px-[70px] py-[60px]">
        <div className="max-w-[1360px] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#9FE870] flex items-center justify-center text-[48px] font-black text-[#163300] flex-shrink-0 border-4 border-white/20">
              {profile.display_name?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-[37px] font-black text-[#9FE870] leading-tight">
                    {profile.display_name}
                  </h1>
                  {profile.city && (
                    <div className="flex items-center gap-2 mt-2 text-white/70">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[16px]">{profile.city}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.niche?.map((n) => (
                      <span
                        key={n}
                        className="text-[12px] font-semibold px-3 py-1 bg-white/10 text-white rounded-full"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSaved(!saved)}
                    className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${saved ? 'fill-red-400 stroke-red-400' : 'stroke-white'}`}
                    />
                  </button>
                  <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <Share2 className="w-5 h-5 stroke-white" />
                  </button>
                </div>
              </div>

              {profile.bio && (
                <p className="mt-4 text-[16px] text-white/80 leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Content Packages', value: packages.length },
              { label: 'Reputation Score', value: profile.reputation_score || '—' },
              { label: 'Languages', value: profile.language?.length || '—' },
              { label: 'Niches', value: profile.niche?.length || '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-[16px] px-5 py-4 text-center">
                <p className="text-[30px] font-black text-[#9FE870]">{s.value}</p>
                <p className="text-[14px] text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: packages + reviews */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Content Packages */}
            <section>
              <h2 className="text-[25px] font-black text-[#121511] mb-5">Content Packages</h2>
              {packages.length === 0 ? (
                <div className="bg-white rounded-[24px] p-10 text-center">
                  <p className="text-[16px] text-[#6A6C6A]">No packages listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`bg-white rounded-[24px] p-6 border-2 cursor-pointer transition-colors ${
                        selectedPackage?.id === pkg.id
                          ? 'border-[#163300]'
                          : 'border-transparent hover:border-[#EDEFEB]'
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`text-[12px] font-bold px-3 py-1 rounded-full capitalize ${
                            PLATFORM_COLORS[pkg.platform] || 'bg-[#EDEFEB] text-[#163300]'
                          }`}
                        >
                          {pkg.platform}
                        </span>
                        <span className="text-[12px] font-medium px-3 py-1 bg-[#EDEFEB] text-[#6A6C6A] rounded-full">
                          {FORMAT_LABEL[pkg.format] || pkg.format}
                        </span>
                      </div>
                      <p className="text-[30px] font-black text-[#163300] mb-1">
                        ₹{pkg.price_inr.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[14px] text-[#6A6C6A] mb-3">
                        {pkg.delivery_days} day delivery · {pkg.revisions_allowed} revisions
                      </p>
                      {pkg.description && (
                        <p className="text-[14px] text-[#6A6C6A] mb-4 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                      <button className="w-full bg-[#9FE870] text-[#163300] font-bold text-[15px] py-3 rounded-full hover:bg-[#8fdc60] transition-colors">
                        Buy Package
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[25px] font-black text-[#121511]">Reviews</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-[#9FE870] stroke-[#9FE870]" />
                    <span className="text-[20px] font-black text-[#121511]">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-[14px] text-[#6A6C6A]">
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="bg-white rounded-[24px] p-10 text-center">
                  <p className="text-[16px] text-[#6A6C6A]">No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Sub-ratings */}
                  <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
                    <StarBar value={avgComm} label="Communication" />
                    <StarBar value={avgTime} label="Timeliness" />
                    <StarBar value={avgSat} label="Satisfaction" />
                  </div>

                  {/* Individual reviews */}
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-white rounded-[24px] p-6">
                      <div className="flex items-center gap-2 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < r.rating_overall
                                ? 'fill-[#9FE870] stroke-[#9FE870]'
                                : 'stroke-[#E8E8E8] fill-[#E8E8E8]'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-[14px] text-[#6A6C6A]">
                          {new Date(r.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      {r.text && (
                        <p className="text-[16px] text-[#121511] leading-relaxed">{r.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right: sticky purchase widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-[24px] p-6">
                <p className="text-[14px] text-[#6A6C6A] mb-2">Starting from</p>
                <p className="text-[37px] font-black text-[#163300] mb-1">
                  {packages.length > 0
                    ? `₹${Math.min(...packages.map((p) => p.price_inr)).toLocaleString('en-IN')}`
                    : '—'}
                </p>

                {packages.length > 0 && (
                  <>
                    <div className="my-4">
                      <label className="text-[14px] font-semibold text-[#121511] mb-2 block">
                        Select Package
                      </label>
                      <select
                        className="w-full text-[15px] px-4 py-3 rounded-[12px] border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] cursor-pointer"
                        value={selectedPackage?.id || ''}
                        onChange={(e) => {
                          const pkg = packages.find((p) => p.id === e.target.value)
                          if (pkg) setSelectedPackage(pkg)
                        }}
                      >
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.platform} {FORMAT_LABEL[pkg.format] || pkg.format} — ₹{pkg.price_inr.toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPackage && (
                      <div className="bg-[#EDEFEB] rounded-[12px] p-4 mb-4 text-[14px] text-[#6A6C6A]">
                        <div className="flex justify-between mb-1">
                          <span>Delivery</span>
                          <span className="font-semibold text-[#121511]">
                            {selectedPackage.delivery_days} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revisions</span>
                          <span className="font-semibold text-[#121511]">
                            {selectedPackage.revisions_allowed}
                          </span>
                        </div>
                      </div>
                    )}

                    <button className="w-full bg-[#9FE870] text-[#163300] font-black text-[16px] py-4 rounded-full hover:bg-[#8fdc60] transition-colors mb-3">
                      Add to Cart
                    </button>
                    <button className="w-full border-2 border-[#163300] text-[#163300] font-bold text-[15px] py-3 rounded-full hover:bg-[#163300] hover:text-[#9FE870] transition-colors">
                      Negotiate a Package
                    </button>
                    <p className="mt-4 text-[12px] text-center text-[#6A6C6A]">
                      🔒 Escrow-protected · GST invoice included
                    </p>
                  </>
                )}

                {packages.length === 0 && (
                  <p className="text-[14px] text-[#6A6C6A] mt-2">
                    This creator hasn&apos;t listed packages yet.
                  </p>
                )}
              </div>

              {/* Analytics placeholder */}
              <div className="bg-white rounded-[24px] p-6 mt-4">
                <h3 className="text-[18px] font-bold text-[#121511] mb-4">Analytics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#6A6C6A]">Avg. Engagement</span>
                    <span className="font-bold text-[#121511]">—</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#6A6C6A]">Audience</span>
                    <span className="font-bold text-[#121511]">—</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#6A6C6A]">Avg. Views</span>
                    <span className="font-bold text-[#121511]">—</span>
                  </div>
                </div>
                <p className="text-[12px] text-[#6A6C6A] mt-4 text-center">
                  Analytics available after first campaign
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Creators */}
        {similarCreators.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[25px] font-black text-[#121511] mb-6">Similar Creators</h2>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {similarCreators.map((c, i) => {
                const colors = [
                  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
                  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
                  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
                  { bg: 'bg-[#121511]', text: 'text-white' },
                ][i % 4]
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-[24px] p-5 min-w-[240px] hover:-translate-y-1 transition-transform cursor-pointer flex-shrink-0"
                    onClick={() => router.push(`/influencer/${c.id}`)}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mb-3 ${colors.bg} ${colors.text}`}
                    >
                      {c.display_name?.[0]?.toUpperCase()}
                    </div>
                    <h3 className="text-[16px] font-bold text-[#121511]">{c.display_name}</h3>
                    <p className="text-[13px] text-[#6A6C6A]">{c.city || 'India'}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.niche?.slice(0, 2).map((n) => (
                        <span key={n} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#163300] rounded-full font-medium">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
