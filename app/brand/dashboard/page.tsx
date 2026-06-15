import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatINR } from '@/lib/types'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-[#F5F5F5] text-[#6A6C6A]',
  shortlisted: 'bg-blue-50 text-blue-700',
  selected: 'bg-[#9FE870]/20 text-[#163300]',
  rejected: 'bg-red-50 text-red-600',
}

export default async function BrandDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id, brand_name, logo_url, description, instagram_url, youtube_url, other_social_links, niche, city').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  const completionItems = [
    { label: 'Upload a brand logo',    done: !!brand.logo_url },
    { label: 'Write a description',    done: !!brand.description },
    { label: 'Add a social link',      done: !!(brand.instagram_url || brand.youtube_url || Object.keys(brand.other_social_links ?? {}).length) },
    { label: 'Select your niche',      done: !!brand.niche },
    { label: 'Add your city',          done: !!brand.city },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  const [
    { count: activeCampaigns },
    { count: totalApplicants },
    { count: conversations },
    { count: newAppsCount },
    msgNotifsResult,
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('brand_id', brand.id).eq('status', 'open'),
    supabase.from('applications').select('campaigns!inner(brand_id)', { count: 'exact', head: true }).eq('campaigns.brand_id', brand.id),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('brand_id', brand.id),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'new_application').eq('read', false),
    // Fetch links to deduplicate — count unique conversations, not individual messages
    supabase.from('notifications').select('link').eq('user_id', user.id).eq('type', 'new_message').eq('read', false),
  ])
  const newMessagesCount = new Set((msgNotifsResult.data ?? []).map((n: { link: string }) => n.link)).size

  const { data: recentApps } = await supabase
    .from('applications')
    .select('id, status, created_at, creator_profiles(display_name, city, niches, username, profile_photo_url), campaigns!inner(id, title, brand_id)')
    .eq('campaigns.brand_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentConvos } = await supabase
    .from('conversations')
    .select('id, last_message_at, creator_accepted, creator_profiles(display_name, username, profile_photo_url), messages(content, created_at)')
    .eq('brand_id', brand.id)
    .order('last_message_at', { ascending: false })
    .limit(3)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 md:p-8 max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-[#121511]">{greeting}, {brand.brand_name} 👋</h1>
          <p className="text-[15px] text-[#6A6C6A] mt-0.5">Here&apos;s what&apos;s happening with your campaigns.</p>
        </div>
        <Link href="/brand/campaigns/new" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors">
          + Post Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Campaigns', value: activeCampaigns ?? 0, href: '/brand/campaigns', newCount: 0 },
          { label: 'Total Applicants', value: totalApplicants ?? 0, href: '/brand/campaigns', newCount: newAppsCount ?? 0 },
          { label: 'Conversations', value: conversations ?? 0, href: '/brand/messages', newCount: 0 },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-[20px] p-5 border border-transparent hover:border-[#163300] transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[36px] font-black text-[#163300] leading-none">{s.value}</p>
              {s.newCount > 0 && (
                <span className="px-2 py-0.5 bg-[#9FE870] text-[#163300] text-[11px] font-black rounded-full flex-shrink-0 mt-1">
                  {s.newCount} new
                </span>
              )}
            </div>
            <p className="text-[14px] text-[#6A6C6A]">{s.label}</p>
          </Link>
        ))}
      </div>

      {completionPct < 100 && (
        <div className="bg-white rounded-[20px] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-black text-[#121511]">Brands with complete profiles get up to 3× more applications.</p>
            <Link href="/brand/profile" className="text-[12px] font-bold text-[#163300] hover:underline flex-shrink-0 ml-4">Edit profile →</Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[22px] font-black text-[#D97706] leading-none">{completionPct}%</span>
            <div className="w-[160px] h-1.5 bg-[#EDEFEB] rounded-full">
              <div className="h-1.5 bg-[#D97706] rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-[#9A9C9A] uppercase tracking-wide">complete</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {completionItems.filter(i => !i.done).map(i => (
              <Link key={i.label} href="/brand/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E8E8] bg-[#FAFAFA] hover:border-[#163300]/30 hover:bg-gray-100 transition-colors text-[12px] font-semibold text-[#4A4C4A]">
                <span className="text-[#D97706] font-bold">+</span>
                {i.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Recent applicants */}
        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-black text-[#121511]">Recent Applicants</h2>
            <Link href="/brand/campaigns" className="text-[13px] font-semibold text-[#163300] hover:underline">View all →</Link>
          </div>
          {!recentApps?.length ? (
            <div className="text-center py-10">
              <p className="text-[40px] mb-3">📭</p>
              <p className="text-[15px] font-semibold text-[#121511] mb-1">No applications yet</p>
              <p className="text-[13px] text-[#6A6C6A] mb-4">Post a campaign to start receiving applications.</p>
              <Link href="/brand/campaigns/new" className="text-[13px] font-bold text-[#163300] hover:underline">Post a campaign →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0 overflow-hidden">
                    {app.creator_profiles?.profile_photo_url
                      ? <img src={app.creator_profiles.profile_photo_url} alt={app.creator_profiles.display_name ?? ''} className="w-full h-full object-cover" />
                      : app.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] truncate">{app.creator_profiles?.display_name ?? 'Creator'}</p>
                    <p className="text-[12px] text-[#6A6C6A] truncate">Applied to: {app.campaigns?.title}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize flex-shrink-0 ${STATUS_COLOR[app.status] ?? 'bg-[#F5F5F5] text-[#6A6C6A]'}`}>{app.status}</span>
                  <Link href={`/brand/campaigns/${app.campaigns?.id}`} className="text-[12px] font-bold text-[#163300] hover:underline flex-shrink-0">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-black text-[#121511]">Recent Messages</h2>
              {(newMessagesCount ?? 0) > 0 && (
                <span className="min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center leading-none">
                  {(newMessagesCount ?? 0) > 99 ? '99+' : newMessagesCount}
                </span>
              )}
            </div>
            <Link href="/brand/messages" className="text-[13px] font-semibold text-[#163300] hover:underline">View all →</Link>
          </div>
          {!recentConvos?.length ? (
            <div className="text-center py-10">
              <p className="text-[40px] mb-3">💬</p>
              <p className="text-[14px] font-semibold text-[#121511] mb-1">No messages yet</p>
              <p className="text-[13px] text-[#6A6C6A]">Messages with creators will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentConvos.map((c: any) => (
                <Link key={c.id} href={`/brand/messages/${c.id}`} className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0 overflow-hidden">
                    {c.creator_profiles?.profile_photo_url
                      ? <img src={c.creator_profiles.profile_photo_url} alt={c.creator_profiles.display_name ?? ''} className="w-full h-full object-cover" />
                      : c.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] truncate">{c.creator_profiles?.display_name ?? 'Creator'}</p>
                    <p className="text-[12px] text-[#6A6C6A] truncate">{c.messages?.length ? c.messages[c.messages.length - 1].content : 'No messages yet'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
