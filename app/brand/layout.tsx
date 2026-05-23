import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { SignOutButton } from '@/components/shared/sign-out-button'

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
  if (role?.role !== 'brand') redirect('/dashboard')

  const { data: brand } = await supabase.from('brand_profiles').select('brand_name').eq('user_id', user.id).maybeSingle()

  return (
    <div className="flex min-h-screen bg-[#EDEFEB] -mt-16 pt-0" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col fixed top-0 left-0 h-full z-40">
        <div className="px-5 pt-6 pb-4 border-b border-[#E8E8E8]">
          <Link href="/brand/dashboard" className="text-[18px] font-black text-[#163300] block">GrabCollab</Link>
          <p className="text-[12px] text-[#6A6C6A] mt-0.5 truncate">{brand?.brand_name ?? 'Brand'}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SideLink href="/brand/dashboard" label="Dashboard" icon="🏠" />
          <SideLink href="/brand/campaigns" label="My Campaigns" icon="📣" />
          <SideLink href="/brand/search" label="Search Creators" icon="🔍" />
          <SideLink href="/brand/messages" label="Messages" icon="💬" />
          <SideLink href="/brand/profile" label="Edit Profile" icon="👤" />
        </nav>
        <div className="px-3 py-4 border-t border-[#E8E8E8]">
          <SignOutButton />
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 ml-[220px] min-h-screen">{children}</main>
    </div>
  )
}

function SideLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] font-semibold text-[#4A4C4A] hover:bg-[#EDEFEB] hover:text-[#121511] transition-colors">
      <span className="text-[16px]">{icon}</span>
      {label}
    </Link>
  )
}
