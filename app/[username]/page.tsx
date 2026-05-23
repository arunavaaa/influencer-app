import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatFollowers } from '@/lib/types'
import { CopyButton } from './copy-button'

export default async function CreatorPublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('*, content_packages(*)')
    .eq('username', username)
    .maybeSingle()

  if (!creator) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userRole } = user ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle() : { data: null }
  const isOwnProfile = user ? (await supabase.from('creator_profiles').select('id').eq('user_id', user.id).eq('username', username).maybeSingle()).data !== null : false

  const activePkgs = creator.content_packages?.filter((p: any) => p.is_active && p.price_inr > 0) ?? []
  const minPrice = activePkgs.length ? Math.min(...activePkgs.map((p: any) => p.price_inr)) : null

  return (
    <div className="min-h-screen bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[800px] mx-auto px-5 py-10">

        {/* Profile card */}
        <div className="bg-white rounded-[24px] p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[32px] flex-shrink-0">
              {creator.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[26px] font-black text-[#121511]">{creator.display_name ?? `@${username}`}</h1>
              <p className="text-[14px] text-[#6A6C6A]">@{username}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {creator.city && <span className="text-[12px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">📍 {creator.city}</span>}
                {creator.languages?.map((l: string) => <span key={l} className="text-[12px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">{l}</span>)}
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-2">
              {isOwnProfile
                ? <Link href="/profile/edit" className="px-4 py-2 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">Edit Profile</Link>
                : userRole?.role === 'brand' && <MessageFromProfile creatorId={creator.id} creatorName={creator.display_name ?? username} />}
            </div>
          </div>

          {creator.bio && <p className="text-[15px] text-[#4A4C4A] leading-relaxed mb-5">{creator.bio}</p>}

          {/* Niches */}
          {creator.niches?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {creator.niches.map((n: string) => <span key={n} className="text-[12px] px-3 py-1 bg-[#163300]/8 text-[#163300] rounded-full font-semibold border border-[#163300]/15">{n}</span>)}
            </div>
          )}

          {/* Social links */}
          <div className="space-y-3 mb-5">
            {creator.instagram_url && (
              <div className="flex items-center justify-between p-3 bg-[#EDEFEB] rounded-[14px]">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">📸</span>
                  <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-[#163300] hover:underline truncate">{creator.instagram_url.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}</a>
                </div>
                {creator.instagram_followers && <span className="text-[13px] font-bold text-[#121511]">{formatFollowers(creator.instagram_followers)} followers</span>}
              </div>
            )}
            {creator.youtube_url && (
              <div className="flex items-center justify-between p-3 bg-[#EDEFEB] rounded-[14px]">
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">▶️</span>
                  <a href={creator.youtube_url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-[#163300] hover:underline truncate">{creator.youtube_url.replace('https://youtube.com/', '').replace('https://www.youtube.com/', '')}</a>
                </div>
                {creator.youtube_subscribers && <span className="text-[13px] font-bold text-[#121511]">{formatFollowers(creator.youtube_subscribers)} subscribers</span>}
              </div>
            )}
          </div>

          {/* Share */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#F0F0F0]">
            <span className="text-[13px] text-[#6A6C6A]">grabcollab.com/{username}</span>
            <CopyButton url={`https://grabcollab.com/${username}`} />
          </div>
        </div>

        {/* Content packages */}
        {activePkgs.length > 0 && (
          <div className="bg-white rounded-[24px] p-6 mb-6">
            <h2 className="text-[20px] font-black text-[#121511] mb-5">Content Packages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activePkgs.map((pkg: any) => (
                <div key={pkg.id} className="border border-[#E8E8E8] rounded-[16px] p-4 hover:border-[#163300]/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[15px] font-black text-[#121511]">{pkg.platform} {pkg.content_type}</p>
                    </div>
                    <p className="text-[18px] font-black text-[#163300]">₹{pkg.price_inr.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-3 text-[12px] text-[#6A6C6A]">
                    <span>⏱ {pkg.delivery_days} days</span>
                    <span>🔄 {pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}</span>
                  </div>
                  {pkg.description && <p className="text-[13px] text-[#4A4C4A] mt-2">{pkg.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA for brands */}
        {!isOwnProfile && userRole?.role !== 'creator' && (
          <div className="bg-[#163300] rounded-[24px] p-6 text-center">
            <p className="text-[18px] font-black text-white mb-2">Interested in working with {creator.display_name?.split(' ')[0]}?</p>
            <p className="text-[14px] text-white/60 mb-5">{minPrice ? `Starting from ₹${minPrice.toLocaleString('en-IN')}` : 'Rates available on request'}</p>
            {!user
              ? <Link href="/signup?role=brand" className="inline-block bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#8fdc60] transition-colors">Sign Up to Message →</Link>
              : <MessageFromProfile creatorId={creator.id} creatorName={creator.display_name ?? username} />}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageFromProfile({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  return (
    <form action={async () => {
      'use server'
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (!brand) return
      const { data: existing } = await supabase.from('conversations').select('id').eq('brand_id', brand.id).eq('creator_id', creatorId).maybeSingle()
      if (existing) { const { redirect } = await import('next/navigation'); redirect(`/brand/messages/${existing.id}`) }
      const { data } = await supabase.from('conversations').insert({ brand_id: brand.id, creator_id: creatorId, initiated_by: 'brand', creator_accepted: null }).select('id').single()
      if (data) { const { redirect } = await import('next/navigation'); redirect(`/brand/messages/${data.id}`) }
    }}>
      <button type="submit" className="px-5 py-2.5 bg-[#9FE870] text-[#163300] text-[14px] font-bold rounded-full hover:bg-[#8fdc60] transition-colors">
        Message {creatorName.split(' ')[0]} →
      </button>
    </form>
  )
}

