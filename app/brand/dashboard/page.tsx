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

  const { data: brand } = await supabase.from('brand_profiles').select('id, brand_name').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  const [{ count: activeCampaigns }, { count: totalApplicants }, { count: conversations }] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('brand_id', brand.id).eq('status', 'open'),
    supabase.from('applications').select('campaigns!inner(brand_id)', { count: 'exact', head: true }).eq('campaigns.brand_id', brand.id),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('brand_id', brand.id),
  ])

  const { data: recentApps } = await supabase
    .from('applications')
    .select('id, status, created_at, creator_profiles(display_name, city, niches, username), campaigns!inner(title, brand_id)')
    .eq('campaigns.brand_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentConvos } = await supabase
    .from('conversations')
    .select('id, last_message_at, creator_accepted, creator_profiles(display_name, username), messages(content, created_at)')
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
          { label: 'Active Campaigns', value: activeCampaigns ?? 0, href: '/brand/campaigns' },
          { label: 'Total Applicants', value: totalApplicants ?? 0, href: '/brand/campaigns' },
          { label: 'Conversations', value: conversations ?? 0, href: '/brand/messages' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-[20px] p-5 hover:shadow-md transition-shadow">
            <p className="text-[36px] font-black text-[#163300]">{s.value}</p>
            <p className="text-[14px] text-[#6A6C6A] mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

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
                <div key={app.id} className="flex items-center gap-4 p-3 rounded-[14px] hover:bg-[#EDEFEB] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                    {app.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] truncate">{app.creator_profiles?.display_name ?? 'Creator'}</p>
                    <p className="text-[12px] text-[#6A6C6A] truncate">Applied to: {app.campaigns?.title}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize flex-shrink-0 ${STATUS_COLOR[app.status] ?? 'bg-[#F5F5F5] text-[#6A6C6A]'}`}>{app.status}</span>
                  <Link href={`/brand/campaigns/${app.campaigns?.brand_id}`} className="text-[12px] font-bold text-[#163300] hover:underline flex-shrink-0">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-black text-[#121511]">Recent Messages</h2>
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
                <Link key={c.id} href={`/brand/messages/${c.id}`} className="flex items-center gap-3 p-3 rounded-[14px] hover:bg-[#EDEFEB] transition-colors block">
                  <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                    {c.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] truncate">{c.creator_profiles?.display_name ?? 'Creator'}</p>
                    <p className="text-[12px] text-[#6A6C6A] truncate">{c.messages?.[0]?.content ?? 'No messages yet'}</p>
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
