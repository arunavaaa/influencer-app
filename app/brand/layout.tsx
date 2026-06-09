import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandSideNav } from './side-nav'
import { BrandSidebarProfileMenu } from './sidebar-profile-menu'
import { FeedbackWidget } from '@/components/ui/feedback-widget'

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use brand_profiles as the source of truth — avoids dependency on users.role
  // which can be null due to a DB trigger creating the row before our code sets the role
  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('brand_name, logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!brand) {
    // No brand profile — send creators home, everyone else to login
    const { data: creator } = await supabase
      .from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
    redirect(creator ? '/dashboard' : '/onboarding/brand')
  }

  const [msgNotifsResult, { count: newAppsCount }] = await Promise.all([
    supabase.from('notifications').select('link')
      .eq('user_id', user.id).eq('type', 'new_message').eq('read', false),
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('type', 'new_application').eq('read', false),
  ])
  const unreadMessagesCount = new Set((msgNotifsResult.data ?? []).map((n: { link: string }) => n.link)).size

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col h-full z-40">
        <div className="px-5 pt-6 pb-4 border-b border-[#E8E8E8]">
          <span className="text-[18px] font-black text-[#163300] block">GrabCollab</span>
        </div>
        <BrandSideNav unreadMessagesCount={unreadMessagesCount ?? 0} newAppsCount={newAppsCount ?? 0} />
        <BrandSidebarProfileMenu
          brandName={brand.brand_name ?? 'Brand'}
          logoUrl={brand.logo_url ?? null}
        />
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
      <FeedbackWidget />
    </div>
  )
}
