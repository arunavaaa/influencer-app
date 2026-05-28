import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandSideNav } from './side-nav'
import { BrandSidebarProfileMenu } from './sidebar-profile-menu'

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  if (role?.role !== 'brand') redirect('/dashboard')

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('brand_name, logo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col h-full z-40">
        <div className="px-5 pt-6 pb-4 border-b border-[#E8E8E8]">
          <span className="text-[18px] font-black text-[#163300] block">GrabCollab</span>
        </div>
        <BrandSideNav />
        <BrandSidebarProfileMenu
          brandName={brand?.brand_name ?? 'Brand'}
          logoUrl={brand?.logo_url ?? null}
        />
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
