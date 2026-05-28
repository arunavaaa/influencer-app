import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  const [{ count: appsSent }, { count: shortlisted }, { count: selected }, { count: packagesCount },
         { count: newShortlists }, { count: newSelections }] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id).eq('status', 'shortlisted'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id).eq('status', 'selected'),
    supabase.from('content_packages').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'shortlisted').eq('read', false),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'selected').eq('read', false),
  ])

  const completionItems = [
    { label: 'Upload a profile photo', done: !!creator.profile_photo_url },
    { label: 'Write a short bio', done: !!creator.bio },
    { label: 'Add your city', done: !!creator.city },
    { label: 'Add the languages you speak', done: !!(creator.languages?.length) },
    { label: 'Add content packages with pricing', done: (packagesCount ?? 0) > 0 },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  const { data: campaigns } = await supabase.from('campaigns').select('id, title, platforms, niches, budget_inr, application_deadline').eq('status', 'open').containedBy('niches', creator.niches ?? []).limit(3)

  // Pending brand requests (cold outreach awaiting creator acceptance)
  const { data: pendingRequests } = await supabase
    .from('conversations')
    .select('id, brand_profiles(brand_name)')
    .eq('creator_id', creator.id)
    .is('creator_accepted', null)
    .eq('initiated_by', 'brand')
    .order('created_at', { ascending: false })

  // Count unique conversations with unread messages (not individual messages)
  const { data: unreadMsgNotifs } = await supabase
    .from('notifications')
    .select('link')
    .eq('user_id', user.id)
    .eq('type', 'new_message')
    .eq('read', false)
  const unreadMessages = new Set((unreadMsgNotifs ?? []).map((n: { link: string }) => n.link)).size

  // Accepted chats only — requests are shown separately
  const { data: recentMessages } = await supabase
    .from('conversations')
    .select('id, last_message_at, brand_profiles(brand_name, logo_url), messages(content)')
    .eq('creator_id', creator.id)
    .eq('creator_accepted', true)
    .order('last_message_at', { ascending: false })
    .limit(3)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 md:p-8 max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-[#121511]">{greeting}, {creator.display_name ?? 'Creator'} 👋</h1>
        <p className="text-[15px] text-[#6A6C6A] mt-0.5">Welcome to your creator hub.</p>
      </div>

      {completionPct < 100 && (
        <div className="bg-white rounded-[20px] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] font-black text-[#121511]">Creators with complete profiles get up to 3× more brand enquiries.</p>
            <Link href="/profile/edit" className="text-[12px] font-bold text-[#163300] hover:underline flex-shrink-0 ml-4">Edit profile →</Link>
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
              <Link key={i.label} href="/profile/edit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E8E8] bg-[#FAFAFA] hover:border-[#163300]/30 hover:bg-[#EDEFEB] transition-colors text-[12px] font-semibold text-[#4A4C4A]">
                <span className="text-[#D97706] font-bold">+</span>
                {i.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Applications Sent', value: appsSent ?? 0, href: '/applications', newCount: 0 },
          { label: 'Shortlisted', value: shortlisted ?? 0, href: '/applications?filter=shortlisted', newCount: newShortlists ?? 0 },
          { label: 'Active Projects', value: selected ?? 0, href: '/projects', newCount: newSelections ?? 0 },
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

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Open campaigns */}
        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-black text-[#121511]">Campaigns for You</h2>
            <Link href="/campaigns" className="text-[13px] font-semibold text-[#163300] hover:underline">Browse all →</Link>
          </div>
          {!campaigns?.length ? (
            <div className="text-center py-8">
              <p className="text-[40px] mb-2">📣</p>
              <p className="text-[14px] text-[#6A6C6A]">No matching campaigns right now. Check back soon!</p>
              <Link href="/campaigns" className="text-[13px] font-bold text-[#163300] hover:underline mt-2 block">Browse all campaigns →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c: any) => (
                <div key={c.id} className="border border-[#E8E8E8] rounded-[14px] p-4 hover:border-[#163300]/30 transition-colors">
                  <p className="text-[15px] font-bold text-[#121511] mb-1">{c.title}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {c.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                  </div>
                  <div className="flex items-center justify-between">
                    {c.budget_inr ? <span className="text-[13px] font-semibold text-[#163300]">₹{c.budget_inr.toLocaleString('en-IN')}</span> : <span className="text-[13px] text-[#9A9C9A]">Budget TBD</span>}
                    <Link href={`/campaigns`} className="text-[12px] font-bold text-[#163300] hover:underline">Apply →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-black text-[#121511]">Messages</h2>
              {((pendingRequests?.length ?? 0) + (unreadMessages ?? 0)) > 0 && (
                <span className="min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center leading-none">
                  {((pendingRequests?.length ?? 0) + (unreadMessages ?? 0)) > 99 ? '99+' : (pendingRequests?.length ?? 0) + (unreadMessages ?? 0)}
                </span>
              )}
            </div>
            <Link href="/messages" className="text-[13px] font-semibold text-[#163300] hover:underline">View all →</Link>
          </div>

          {!(pendingRequests?.length) && !recentMessages?.length ? (
            <div className="text-center py-8">
              <p className="text-[40px] mb-2">💬</p>
              <p className="text-[14px] text-[#6A6C6A]">No messages yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pending brand requests — single compact summary row */}
              {(pendingRequests?.length ?? 0) > 0 && (
                <Link href="/messages"
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px]">📩</span>
                    <p className="text-[13px] font-bold text-amber-800 truncate">
                      {pendingRequests!.length > 99
                        ? '99+ brands want to connect'
                        : pendingRequests!.length === 1
                          ? '1 brand wants to connect'
                          : `${pendingRequests!.length} brands want to connect`}
                    </p>
                  </div>
                  <span className="text-[12px] font-bold text-amber-700 flex-shrink-0">View →</span>
                </Link>
              )}

              {/* Divider if both exist */}
              {(pendingRequests?.length ?? 0) > 0 && (recentMessages?.length ?? 0) > 0 && (
                <div className="border-t border-[#F0F0F0] my-1" />
              )}

              {/* Active chats */}
              {recentMessages?.map((c: any) => (
                <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3 p-3 rounded-[12px] hover:bg-[#EDEFEB] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[13px] flex-shrink-0 overflow-hidden">
                    {c.brand_profiles?.logo_url
                      ? <img src={c.brand_profiles.logo_url} alt={c.brand_profiles.brand_name ?? ''} className="w-full h-full object-cover" />
                      : c.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] truncate">{c.brand_profiles?.brand_name}</p>
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
