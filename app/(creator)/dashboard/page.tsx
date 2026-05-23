import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CreatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  const [{ count: appsSent }, { count: shortlisted }, { count: selected }] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id).eq('status', 'shortlisted'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', creator.id).eq('status', 'selected'),
  ])

  // Profile completion
  const fields = [creator.display_name, creator.bio, creator.profile_photo_url, creator.instagram_url, creator.niches?.length, creator.languages?.length]
  const done = fields.filter(Boolean).length
  const total = fields.length
  const pct = Math.round((done / total) * 100)

  const nudges = [
    !creator.instagram_url && { label: 'Add your Instagram link', href: '/profile/edit' },
    !creator.profile_photo_url && { label: 'Upload a profile photo', href: '/profile/edit' },
    !creator.bio && { label: 'Write a short bio', href: '/profile/edit' },
    !creator.niches?.length && { label: 'Select your content niches', href: '/profile/edit' },
  ].filter(Boolean) as { label: string; href: string }[]

  const { data: campaigns } = await supabase.from('campaigns').select('id, title, platforms, niches, budget_inr, application_deadline').eq('status', 'open').containedBy('niches', creator.niches ?? []).limit(3)

  const { data: recentMessages } = await supabase.from('conversations').select('id, last_message_at, brand_profiles(brand_name), messages(content)').eq('creator_id', creator.id).order('last_message_at', { ascending: false }).limit(3)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 md:p-8 max-w-[1000px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-[#121511]">{greeting}, {creator.display_name ?? 'Creator'} 👋</h1>
        <p className="text-[15px] text-[#6A6C6A] mt-0.5">Welcome to your creator hub.</p>
      </div>

      {/* Profile completion */}
      {pct < 100 && nudges.length > 0 && (
        <div className="bg-white rounded-[24px] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[15px] font-black text-[#121511]">Complete your profile</p>
            <span className="text-[14px] font-bold text-[#163300]">{pct}%</span>
          </div>
          <div className="w-full bg-[#EDEFEB] rounded-full h-2 mb-4">
            <div className="bg-[#163300] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="space-y-2">
            {nudges.slice(0, 3).map(n => (
              <Link key={n.label} href={n.href} className="flex items-center gap-2 text-[13px] font-semibold text-[#163300] hover:underline">
                <span className="w-4 h-4 rounded-full border-2 border-[#163300]/30 flex-shrink-0" />
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Applications Sent', value: appsSent ?? 0, href: '/applications' },
          { label: 'Shortlisted', value: shortlisted ?? 0, href: '/applications?filter=shortlisted' },
          { label: 'Active Projects', value: selected ?? 0, href: '/projects' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-[20px] p-5 hover:shadow-md transition-shadow">
            <p className="text-[36px] font-black text-[#163300]">{s.value}</p>
            <p className="text-[14px] text-[#6A6C6A] mt-1">{s.label}</p>
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
            <h2 className="text-[18px] font-black text-[#121511]">Messages</h2>
            <Link href="/messages" className="text-[13px] font-semibold text-[#163300] hover:underline">View all →</Link>
          </div>
          {!recentMessages?.length ? (
            <div className="text-center py-8">
              <p className="text-[40px] mb-2">💬</p>
              <p className="text-[14px] text-[#6A6C6A]">No messages yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((c: any) => (
                <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3 p-3 rounded-[12px] hover:bg-[#EDEFEB] transition-colors block">
                  <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[13px] flex-shrink-0">
                    {c.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#121511] truncate">{c.brand_profiles?.brand_name}</p>
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
