import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorSideNav } from './side-nav'
import { SidebarProfileMenu } from './sidebar-profile-menu'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  if (role?.role !== 'creator' && role?.role !== 'influencer') redirect('/brand/dashboard')

  const { data: creator } = await supabase
    .from('creator_profiles')
    .select('id, display_name, profile_photo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  // Badge counts for sidenav
  const [pendingResult, notifsResult, msgNotifsResult] = await Promise.all([
    // Pending brand connection requests (cold outreach awaiting creator acceptance)
    supabase.from('conversations').select('*', { count: 'exact', head: true })
      .eq('creator_id', creator?.id ?? '')
      .is('creator_accepted', null)
      .eq('initiated_by', 'brand'),
    // Unread application status notifications (shortlisted / selected / rejected)
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .in('type', ['shortlisted', 'selected', 'rejected']),
    // Unread message notifications — fetch links to deduplicate by conversation
    supabase.from('notifications').select('link')
      .eq('user_id', user.id)
      .eq('type', 'new_message')
      .eq('read', false),
  ])
  const pendingRequestsCount = pendingResult.count ?? 0
  const unreadNotifsCount = notifsResult.count ?? 0
  // Count unique conversations with unread messages (1 per chat, not 1 per message)
  const unreadMsgConvosCount = new Set((msgNotifsResult.data ?? []).map((n: { link: string }) => n.link)).size

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col h-full z-40">
        <div className="px-5 pt-6 pb-4 border-b border-[#E8E8E8]">
          <span className="text-[18px] font-black text-[#163300] block">GrabCollab</span>
        </div>
        <CreatorSideNav
          pendingRequestsCount={pendingRequestsCount}
          unreadNotifsCount={unreadNotifsCount}
          unreadMsgConvosCount={unreadMsgConvosCount}
        />
        <SidebarProfileMenu
          displayName={creator?.display_name ?? 'Creator'}
          avatarUrl={creator?.profile_photo_url ?? null}
        />
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
