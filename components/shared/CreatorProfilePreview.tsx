'use client'

import { Camera, MapPin, CheckCircle, AlertCircle } from 'lucide-react'

function IgIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export type OnboardingData = {
  username: string
  displayName: string
  profileTitle: string
  city: string
  languages: string[]
  bio: string
  niches: string[]
  profilePhotoUrl: string | null
  instagramConnected: boolean
  instagramHandle: string
  followerCount: number | null
  engagementRate: number | null
  contentUrls: string[]
  packages: {
    format: 'Reel' | 'Post' | 'Story'
    price: number | null
    deliveryDays: number
    revisions: number
    description: string
    enabled: boolean
  }[]
}

function formatFollowers(n: number | null): string {
  if (!n) return '--'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatPrice(p: number | null): string {
  if (!p) return ''
  return `₹${p.toLocaleString('en-IN')}`
}

type Props = {
  data: OnboardingData
  isLive?: boolean
}

export default function CreatorProfilePreview({ data, isLive = false }: Props) {
  const hasName = !!data.displayName
  const hasTitle = !!data.profileTitle
  const hasCity = !!data.city
  const hasInstagram = data.instagramConnected
  const hasNiches = data.niches.length > 0
  const hasLanguages = data.languages.length > 0
  const hasBio = !!data.bio
  const hasContent = data.contentUrls.length > 0
  const hasPackages = data.packages.some(p => p.enabled && p.price)
  const hasPhoto = !!data.profilePhotoUrl

  const minPrice = data.packages
    .filter(p => p.enabled && p.price)
    .map(p => p.price!)
    .sort((a, b) => a - b)[0] ?? null

  return (
    <div className="h-full flex flex-col">
      {/* Header label */}
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#163300] mb-4">
        Your Profile Preview
      </p>

      {/* Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#163300]/8 flex-1 flex flex-col">
        {/* Cover banner */}
        <div className="h-[100px] bg-gradient-to-br from-[#9FE870] to-[#163300] relative flex-shrink-0">
          {isLive && (
            <span className="absolute top-3 right-3 bg-[#9FE870] text-[#163300] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
              Live
            </span>
          )}
        </div>

        {/* Profile section */}
        <div className="px-5 pb-4 flex-1 overflow-y-auto">
          {/* Avatar (overlapping cover) */}
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="w-[68px] h-[68px] rounded-full border-4 border-white overflow-hidden bg-[#EDEFEB] flex items-center justify-center flex-shrink-0">
              {hasPhoto ? (
                <img src={data.profilePhotoUrl!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-[#163300]/30" />
              )}
            </div>
            {hasInstagram ? (
              <span className="flex items-center gap-1 bg-[#9FE870]/20 text-[#163300] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#9FE870]">
                <CheckCircle className="w-3 h-3 text-[#163300]" />
                Verified
              </span>
            ) : data.instagramHandle === 'skip' ? (
              <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                <AlertCircle className="w-3 h-3" />
                Unverified
              </span>
            ) : null}
          </div>

          {/* Name + title */}
          <div className={`transition-all duration-200 ${hasName ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}>
            {hasName ? (
              <p className="text-[17px] font-black text-[#121511] leading-tight">{data.displayName}</p>
            ) : (
              <div className="h-[18px] w-32 bg-[#EDEFEB] rounded-full mb-1" />
            )}
            {hasTitle ? (
              <p className="text-[13px] text-[#6A6C6A] mt-0.5">{data.profileTitle}</p>
            ) : (
              <div className="h-[13px] w-24 bg-[#EDEFEB] rounded-full mt-1.5" />
            )}
          </div>

          {/* City */}
          {hasCity ? (
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="w-3.5 h-3.5 text-[#6A6C6A]" />
              <span className="text-[12px] text-[#6A6C6A]">{data.city}</span>
            </div>
          ) : (
            <div className="h-[13px] w-20 bg-[#EDEFEB] rounded-full mt-2" />
          )}

          {/* Instagram stats */}
          <div className="flex items-center gap-3 mt-3 py-3 border-t border-b border-[#EDEFEB]">
            <IgIcon className="w-4 h-4 text-[#E1306C] flex-shrink-0" />
            {hasInstagram ? (
              <>
                <div>
                  <p className="text-[13px] font-black text-[#121511]">{formatFollowers(data.followerCount)}</p>
                  <p className="text-[11px] text-[#6A6C6A]">Followers</p>
                </div>
                <div className="w-px h-8 bg-[#EDEFEB]" />
                <div>
                  <p className="text-[13px] font-black text-[#121511]">
                    {data.engagementRate ? `${data.engagementRate.toFixed(1)}%` : '--'}
                  </p>
                  <p className="text-[11px] text-[#6A6C6A]">Engagement</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[13px] font-black text-[#6A6C6A]">--</p>
                  <p className="text-[11px] text-[#6A6C6A]">Followers</p>
                </div>
                <div className="w-px h-8 bg-[#EDEFEB]" />
                <div>
                  <p className="text-[13px] font-black text-[#6A6C6A]">--</p>
                  <p className="text-[11px] text-[#6A6C6A]">Engagement</p>
                </div>
              </>
            )}
          </div>

          {/* Niches */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hasNiches ? (
              data.niches.slice(0, 4).map(n => (
                <span
                  key={n}
                  className="text-[11px] font-semibold px-2.5 py-1 bg-[#EDEFEB] text-[#163300] rounded-full transition-all duration-200 opacity-100"
                >
                  {n}
                </span>
              ))
            ) : (
              <>
                <div className="h-[26px] w-16 bg-[#EDEFEB] rounded-full" />
                <div className="h-[26px] w-20 bg-[#EDEFEB] rounded-full" />
                <div className="h-[26px] w-14 bg-[#EDEFEB] rounded-full" />
              </>
            )}
          </div>

          {/* Languages */}
          {hasLanguages && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.languages.slice(0, 4).map(l => (
                <span
                  key={l}
                  className="text-[11px] font-medium px-2.5 py-1 bg-white border border-[#163300]/15 text-[#6A6C6A] rounded-full"
                >
                  {l}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {hasBio ? (
            <p className="text-[12px] text-[#6A6C6A] mt-3 leading-relaxed line-clamp-3">
              {data.bio}
            </p>
          ) : (
            <div className="mt-3 space-y-1.5">
              <div className="h-[12px] w-full bg-[#EDEFEB] rounded-full" />
              <div className="h-[12px] w-4/5 bg-[#EDEFEB] rounded-full" />
              <div className="h-[12px] w-3/5 bg-[#EDEFEB] rounded-full" />
            </div>
          )}

          {/* Content grid */}
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#163300]/50 mb-2">Content</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => {
                const url = data.contentUrls[i]
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden bg-[#EDEFEB] flex items-center justify-center"
                  >
                    {url ? (
                      url.endsWith('.mp4') ? (
                        <video src={url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full bg-[#EDEFEB]" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Packages */}
          {hasPackages ? (
            <div className="mt-4 p-3 bg-[#163300] rounded-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9FE870]/70 mb-1">Starting from</p>
              <p className="text-[20px] font-black text-white">{formatPrice(minPrice)}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.packages.filter(p => p.enabled && p.price).map(p => (
                  <span key={p.format} className="text-[11px] font-semibold px-2 py-0.5 bg-white/10 text-white/70 rounded-full">
                    {p.format}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-[#EDEFEB] rounded-2xl">
              <p className="text-[12px] text-[#6A6C6A]">Set your packages to show pricing</p>
            </div>
          )}

          {/* Profile URL */}
          <div className="mt-3 mb-1">
            <p className="text-[11px] text-[#6A6C6A]">
              crayon.in/
              <span className={data.username ? 'text-[#163300] font-semibold' : 'text-[#EDEFEB]'}>
                {data.username || '___________'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
