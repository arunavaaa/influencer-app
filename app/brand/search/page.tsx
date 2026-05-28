import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SearchFilters } from './search-filters'
import { formatFollowers } from '@/lib/types'

export default async function BrandSearch({ searchParams }: { searchParams: Promise<{ niche?: string; city?: string; language?: string; followers?: string; platform?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  const niches = sp.niche?.split(',').filter(Boolean) ?? []
  const cities = sp.city?.split(',').filter(Boolean) ?? []
  const langs = sp.language?.split(',').filter(Boolean) ?? []
  const plats = sp.platform?.split(',').filter(Boolean) ?? []

  let query = supabase.from('creator_profiles').select('id, username, display_name, city, niches, languages, instagram_followers, youtube_subscribers, profile_photo_url, content_packages(price_inr)').eq('is_profile_live', true)

  if (niches.length === 1) query = query.contains('niches', niches)
  else if (niches.length > 1) query = (query as any).overlaps('niches', niches)

  if (cities.length === 1) query = query.eq('city', cities[0])
  else if (cities.length > 1) query = query.in('city', cities)

  if (langs.length === 1) query = query.contains('languages', langs)
  else if (langs.length > 1) query = (query as any).overlaps('languages', langs)

  if (sp.followers) {
    const [minStr, maxStr] = sp.followers.split('-')
    if (minStr) query = query.gte('instagram_followers', Number(minStr))
    if (maxStr) query = query.lte('instagram_followers', Number(maxStr))
  }

  if (plats.length > 0) {
    const orParts: string[] = []
    if (plats.includes('Instagram')) orParts.push('instagram_url.not.is.null')
    if (plats.includes('YouTube')) orParts.push('youtube_url.not.is.null')
    if (orParts.length) query = query.or(orParts.join(','))
  }

  const { data: creators } = await query.order('instagram_followers', { ascending: false }).limit(48)

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">Search Creators</h1>
      <SearchFilters />
      <p className="text-[14px] text-[#6A6C6A] mb-5 mt-4">{creators?.length ?? 0} creators found</p>

      {!creators?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">🔍</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No creators found</p>
          <p className="text-[15px] text-[#6A6C6A]">Try adjusting your filters or check back later as more creators join.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {creators.map((c: any) => {
            const minPrice = c.content_packages?.length ? Math.min(...c.content_packages.map((p: any) => p.price_inr)) : null
            return (
              <div key={c.id} className="bg-white rounded-[20px] p-5 border border-transparent hover:border-[#163300]/30 transition-colors flex flex-col">
                {/* Header: avatar + name/city + price */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[20px] flex-shrink-0 overflow-hidden">
                    {c.profile_photo_url
                      ? <img src={c.profile_photo_url} alt={c.display_name} className="w-full h-full object-cover" />
                      : c.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-black text-[#121511] truncate">{c.display_name ?? 'Creator'}</p>
                    <p className="text-[13px] text-[#6A6C6A]">{c.city}</p>
                  </div>
                  {minPrice != null && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[10px] font-semibold text-[#9A9C9A]">starting from</p>
                      <p className="text-[18px] font-black text-[#163300] leading-tight">₹{minPrice.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.niches?.slice(0, 2).map((n: string) => <span key={n} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{n}</span>)}
                  {c.languages?.slice(0, 2).map((l: string) => <span key={l} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">{l}</span>)}
                </div>

                {/* Followers */}
                {c.instagram_followers > 0 && (
                  <p className="text-[12px] text-[#6A6C6A] mb-3">📸 {formatFollowers(c.instagram_followers)} followers</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 mt-auto border-t border-[#F0F0F0]">
                  {c.username && (
                    <Link href={`/${c.username}`} className="flex-1 text-center py-2.5 bg-[#EDEFEB] text-[#121511] text-[13px] font-bold rounded-full hover:bg-[#E0E2DE] transition-colors">
                      View Profile
                    </Link>
                  )}
                  <MessageButton brandId={brand.id} creatorId={c.id} creatorName={c.display_name ?? 'Creator'} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MessageButton({ brandId, creatorId, creatorName }: { brandId: string; creatorId: string; creatorName: string }) {
  return (
    <form className="flex-1" action={async () => {
      'use server'
      const supabase = await createClient()
      const { data: existing } = await supabase.from('conversations').select('id').eq('brand_id', brandId).eq('creator_id', creatorId).maybeSingle()
      if (existing) { redirect(`/brand/messages/${existing.id}`) }
      const { data } = await supabase.from('conversations').insert({ brand_id: brandId, creator_id: creatorId, initiated_by: 'brand', creator_accepted: null }).select('id').single()
      if (data) redirect(`/brand/messages/${data.id}`)
    }}>
      <button type="submit" className="w-full py-2.5 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">Message</button>
    </form>
  )
}
