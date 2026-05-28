import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FOLLOWER_RANGES } from '@/lib/types'
import { CopyButton } from './copy-button'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the range label (e.g. "10K – 50K") for a stored min value */
function followerLabel(n: number | null | string | undefined): string | null {
  if (n == null || n === '') return null
  const num = typeof n === 'string' ? parseInt(n) : n
  if (isNaN(num)) return null
  return FOLLOWER_RANGES.find(r => r.min === num)?.label ?? null
}

/** Detect platform from the URL — so even if a user saved the wrong URL in the
 *  wrong field the icon is still correct */
type Platform = 'instagram' | 'youtube' | 'x' | 'facebook' | 'linkedin' | 'generic'
function detectPlatform(url: string): Platform {
  if (url.includes('instagram.com'))                            return 'instagram'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('x.com') || url.includes('twitter.com'))    return 'x'
  if (url.includes('facebook.com') || url.includes('fb.com'))  return 'facebook'
  if (url.includes('linkedin.com'))                             return 'linkedin'
  return 'generic'
}

/** Returns a clean, short handle for display */
function socialDisplay(url: string, platform: Platform): string {
  try {
    const { pathname } = new URL(url)
    const path = pathname.replace(/^\//, '').replace(/\/$/, '')
    if (!path) return url.replace(/^https?:\/\/(www\.)?/, '')
    if (platform === 'instagram' || platform === 'x') return '@' + path
    if (platform === 'youtube') return path.startsWith('@') ? path : '@' + path
    return path
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '')
  }
}

// ── Brand SVG icons ───────────────────────────────────────────────────────────

function InstagramIcon() {
  return (
    <svg viewBox="0 0 198 198" className="w-[20px] h-[20px] flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M98.9797 0H98.53C44.1134 0 0 44.1264 0 98.559V99.0089C0 153.441 44.1134 197.568 98.53 197.568H98.9797C153.396 197.568 197.51 153.441 197.51 99.0089V98.559C197.51 44.1264 153.396 0 98.9797 0Z" fill="url(#ig_grad)"/>
      <path d="M129.316 40.1948H68.2008C51.3166 40.1948 37.581 53.9345 37.581 70.8236V126.751C37.581 143.64 51.3166 157.38 68.2008 157.38H129.316C146.2 157.38 159.936 143.64 159.936 126.751V70.8236C159.936 53.9345 146.2 40.1948 129.316 40.1948ZM48.3827 70.8236C48.3827 59.8941 57.2745 50.9996 68.2008 50.9996H129.316C140.242 50.9996 149.134 59.8941 149.134 70.8236V126.751C149.134 137.681 140.242 146.575 129.316 146.575H68.2008C57.2745 146.575 48.3827 137.681 48.3827 126.751V70.8236Z" fill="white"/>
      <path d="M98.7584 127.271C114.459 127.271 127.24 114.493 127.24 98.7806C127.24 83.0682 114.466 70.2906 98.7584 70.2906C83.0506 70.2906 70.2768 83.0682 70.2768 98.7806C70.2768 114.493 83.0506 127.271 98.7584 127.271ZM98.7584 81.1024C108.508 81.1024 116.438 89.0347 116.438 98.7875C116.438 108.54 108.508 116.473 98.7584 116.473C89.0085 116.473 81.0785 108.54 81.0785 98.7875C81.0785 89.0347 89.0085 81.1024 98.7584 81.1024Z" fill="white"/>
      <path d="M129.876 74.8935C134.104 74.8935 137.55 71.4534 137.55 67.2173C137.55 62.9811 134.111 59.541 129.876 59.541C125.642 59.541 122.202 62.9811 122.202 67.2173C122.202 71.4534 125.642 74.8935 129.876 74.8935Z" fill="white"/>
      <defs>
        <linearGradient id="ig_grad" x1="28.8552" y1="168.704" x2="168.696" y2="28.9118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAAD4F"/>
          <stop offset="0.35" stopColor="#DD2A7B"/>
          <stop offset="0.62" stopColor="#9537B0"/>
          <stop offset="1" stopColor="#515BD4"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 197 197" className="w-[20px] h-[20px] flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M196.949 98.5036C196.949 44.1016 152.861 0 98.4746 0C44.0886 0 0 44.1016 0 98.5036C0 152.906 44.0886 197.007 98.4746 197.007C152.861 197.007 196.949 152.906 196.949 98.5036Z" fill="#FF0209"/>
      <path d="M140.277 142.131C137.343 142.45 134.34 142.505 131.461 142.498C109.007 142.478 86.5519 142.457 64.1044 142.443C57.0393 142.443 49.3446 142.215 43.8849 137.722C37.7333 132.649 36.4532 123.851 35.955 115.891C35.263 104.982 35.2076 94.0391 35.775 83.1234C36.0864 77.1292 36.6331 70.9896 39.2141 65.5629C41.0686 61.666 44.1617 58.1636 48.1198 56.3224C52.7214 54.1835 57.5376 54.5642 62.4921 54.5573C74.3525 54.5435 86.2129 54.5366 98.0733 54.5227C110.404 54.5089 122.742 54.5019 135.073 54.4881C140.899 54.4881 147.155 54.6058 151.909 57.9767C158.047 62.3235 159.714 70.595 160.482 78.0775C161.901 91.8587 161.922 105.785 160.538 119.567C159.963 125.249 159.008 131.257 155.265 135.57C151.556 139.847 146.055 141.495 140.284 142.125L140.277 142.131Z" fill="white"/>
      <path d="M118.556 98.5036L85.0919 79.178V117.829L118.556 98.5036Z" fill="#FF0209"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 198 198" className="w-[20px] h-[20px] flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M197.503 98.7874C197.503 148.679 160.531 189.926 112.501 196.62C108.01 197.243 103.415 197.568 98.7513 197.568C93.3678 197.568 88.0811 197.139 82.9329 196.308C35.9133 188.736 0 147.953 0 98.7874C0 44.2301 44.217 0 98.7583 0C153.3 0 197.517 44.2301 197.517 98.7874H197.503Z" fill="#1C1C1B"/>
      <path d="M40.0514 43.5656L85.597 104.477L39.7677 154.002H50.085L90.2125 110.644L122.631 154.002H157.735L109.629 89.6645L152.289 43.5656H141.972L105.021 83.4972L75.1621 43.5656H40.0582H40.0514ZM55.2194 51.1656H71.3424L142.553 146.402H126.43L55.2194 51.1656Z" fill="white"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 198 198" className="w-[20px] h-[20px] flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M197.51 98.7874C197.51 148.679 160.538 189.926 112.508 196.62C108.017 197.243 103.422 197.568 98.7583 197.568C93.3748 197.568 88.0881 197.139 82.9398 196.308C35.9134 188.736 0 147.953 0 98.7874C0 44.2301 44.217 0 98.7514 0C153.286 0 197.51 44.2301 197.51 98.7874Z" fill="#1877F2"/>
      <path d="M112.508 79.3165V100.836H139.121L134.907 129.825H112.508V196.613C108.017 197.236 103.422 197.561 98.7583 197.561C93.3747 197.561 88.088 197.132 82.9398 196.301V129.825H58.3955V100.836H82.9398V74.5059C82.9398 58.1706 96.1772 44.9223 112.515 44.9223V44.9361C112.563 44.9361 112.605 44.9223 112.653 44.9223H139.128V69.9929H121.829C116.687 69.9929 112.515 74.1667 112.515 79.3096L112.508 79.3165Z" fill="white"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] flex-shrink-0">
      <rect width="24" height="24" rx="12" fill="#0A66C2"/>
      <path d="M7 9.5H4.5V19H7V9.5zM5.75 8.25a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19.5 13c0-2.5-1-3.8-3-3.8-1.2 0-2 .6-2.5 1.3V9.5H11.5V19H14v-5.2c0-1.1.5-1.8 1.5-1.8s1.5.7 1.5 1.8V19H19.5V13z" fill="white"/>
    </svg>
  )
}

function SocialIcon({ url }: { url: string }) {
  const p = detectPlatform(url)
  if (p === 'instagram') return <InstagramIcon />
  if (p === 'youtube')   return <YouTubeIcon />
  if (p === 'x')         return <XIcon />
  if (p === 'facebook')  return <FacebookIcon />
  if (p === 'linkedin')  return <LinkedInIcon />
  return <span className="text-[16px]">🔗</span>
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
  const { data: userRole } = user
    ? await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    : { data: null }
  const isOwnProfile = user
    ? (await supabase.from('creator_profiles').select('id').eq('user_id', user.id).eq('username', username).maybeSingle()).data !== null
    : false

  const activePkgs = creator.content_packages?.filter((p: any) => p.is_active && p.price_inr > 0) ?? []
  const minPrice = activePkgs.length ? Math.min(...activePkgs.map((p: any) => p.price_inr)) : null

  const other = (creator.other_social_links as Record<string, string>) ?? {}

  // Build social rows: URL + follower label + suffix label
  const socialRows: { url: string; count: string | null; suffix: string }[] = []
  if (creator.instagram_url) socialRows.push({ url: creator.instagram_url, count: followerLabel(creator.instagram_followers), suffix: 'followers' })
  if (creator.youtube_url)   socialRows.push({ url: creator.youtube_url,   count: followerLabel(creator.youtube_subscribers),   suffix: 'subscribers' })
  if (other.x_url)           socialRows.push({ url: other.x_url,           count: followerLabel(other.x_followers),            suffix: 'followers' })
  if (other.facebook_url)    socialRows.push({ url: other.facebook_url,    count: followerLabel(other.facebook_followers),     suffix: 'followers' })

  return (
    <div className="min-h-screen bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[800px] mx-auto px-5 py-10">

        {/* Profile card */}
        <div className="bg-white rounded-[24px] p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[32px] flex-shrink-0 overflow-hidden">
              {creator.profile_photo_url
                ? <img src={creator.profile_photo_url} alt={creator.display_name ?? username} className="w-full h-full object-cover" />
                : <span>{creator.display_name?.[0]?.toUpperCase() ?? '?'}</span>}
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
              {creator.niches.map((n: string) => (
                <span key={n} className="text-[12px] px-3 py-1 bg-[#163300]/8 text-[#163300] rounded-full font-semibold border border-[#163300]/15">{n}</span>
              ))}
            </div>
          )}

          {/* Social links */}
          {socialRows.length > 0 && (
            <div className="space-y-2.5 mb-5">
              {socialRows.map(({ url, count, suffix }) => {
                const platform = detectPlatform(url)
                return (
                  <div key={url} className="flex items-center justify-between px-3.5 py-2.5 bg-[#EDEFEB] rounded-[14px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SocialIcon url={url} />
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[13px] font-semibold text-[#163300] hover:underline truncate">
                        {socialDisplay(url, platform)}
                      </a>
                    </div>
                    {count && (
                      <span className="text-[12px] font-bold text-[#4A4C4A] flex-shrink-0 ml-3 bg-white px-2.5 py-0.5 rounded-full">
                        {count} {suffix}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePkgs.map((pkg: any) => (
                <div key={pkg.id} className="border border-[#E8E8E8] rounded-[16px] p-5 hover:border-[#163300]/20 transition-colors">
                  {/* Platform */}
                  <p className="text-[11px] font-bold text-[#B0B2AF] uppercase tracking-[0.14em] mb-1">{pkg.platform}</p>
                  {/* Content type + price */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-[18px] font-black text-[#121511] leading-snug">{pkg.content_type}</p>
                    <p className="text-[20px] font-black text-[#163300] flex-shrink-0">₹{pkg.price_inr.toLocaleString('en-IN')}</p>
                  </div>
                  {/* Stats — single clean line */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#9A9C9A] border-t border-[#F4F4F4] pt-3">
                    <span className="font-semibold text-[#6A6C6A]">{pkg.delivery_days} day{pkg.delivery_days !== 1 ? 's' : ''}</span>
                    <span>delivery</span>
                    <span className="mx-1 text-[#D8D8D8]">·</span>
                    <span className="font-semibold text-[#6A6C6A]">{pkg.revisions}</span>
                    <span>revision{pkg.revisions !== 1 ? 's' : ''}</span>
                  </div>
                  {pkg.description && <p className="text-[13px] text-[#6A6C6A] mt-2 leading-relaxed">{pkg.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA for brands */}
        {!isOwnProfile && userRole?.role !== 'creator' && userRole?.role !== 'influencer' && (
          <div className="bg-[#163300] rounded-[24px] p-6 text-center">
            <p className="text-[18px] font-black text-white mb-2">Interested in working with {creator.display_name?.split(' ')[0]}?</p>
            <p className="text-[14px] text-white/60 mb-5">{minPrice ? `Starting from ₹${minPrice.toLocaleString('en-IN')}` : 'Rates available on request'}</p>
            {!user
              ? <Link href="/onboarding/brand" className="inline-block bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#8fdc60] transition-colors">Sign Up to Message →</Link>
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
