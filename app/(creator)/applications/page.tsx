import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_CONFIG = {
  pending:    { color: 'bg-[#F5F5F5] text-[#6A6C6A]',        msg: '' },
  shortlisted:{ color: 'bg-blue-50 text-blue-700',            msg: "🎉 You've been shortlisted!" },
  selected:   { color: 'bg-[#9FE870]/20 text-[#163300]',     msg: "✅ You've been selected!" },
  rejected:   { color: 'bg-red-50 text-red-600',              msg: '❌ Not selected this time' },
}

export default async function Applications({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  let query = supabase.from('applications').select('*, campaigns(id, title, platforms, niches, budget_inr, brand_profiles(brand_name, logo_url))').eq('creator_id', creator.id).order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('status', filter)
  const { data: applications } = await query

  const { data: myConvos } = await supabase.from('conversations').select('id, brand_id').eq('creator_id', creator.id)
  const convoByBrand = Object.fromEntries(myConvos?.map(c => [c.brand_id, c.id]) ?? [])

  return (
    <div className="p-6 md:p-8 max-w-[800px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">My Applications</h1>

      <div className="flex gap-2 mb-6 bg-white rounded-[14px] p-1 w-fit flex-wrap">
        {['all', 'pending', 'shortlisted', 'selected', 'rejected'].map(f => (
          <Link key={f} href={`/applications?filter=${f}`}
            className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold capitalize transition-colors ${filter === f ? 'bg-[#163300] text-[#9FE870]' : 'text-[#6A6C6A] hover:text-[#121511]'}`}>
            {f}
          </Link>
        ))}
      </div>

      {!applications?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">📋</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No applications yet</p>
          <p className="text-[15px] text-[#6A6C6A] mb-6">Browse campaigns and apply to get started.</p>
          <Link href="/campaigns" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">Browse Campaigns →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const cfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
            const convoId = convoByBrand[app.campaigns?.brand_profiles?.id]
            return (
              <div key={app.id} className="bg-white rounded-[20px] p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                      {app.campaigns?.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-[13px] text-[#6A6C6A]">{app.campaigns?.brand_profiles?.brand_name}</p>
                      <p className="text-[16px] font-black text-[#121511]">{app.campaigns?.title}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize flex-shrink-0 ${cfg.color}`}>{app.status}</span>
                </div>
                {cfg.msg && <p className="text-[13px] font-semibold text-[#163300] mb-2">{cfg.msg}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {app.campaigns?.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                </div>
                <div className="flex items-center justify-between text-[13px] text-[#6A6C6A] mb-4">
                  {app.proposed_rate_inr && <span>Your rate: <strong className="text-[#163300]">₹{app.proposed_rate_inr.toLocaleString('en-IN')}</strong></span>}
                  <span>{new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {(app.status === 'selected' || app.status === 'shortlisted') && convoId && (
                  <Link href={`/messages/${convoId}`} className="inline-flex items-center gap-2 px-4 py-2 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">
                    Message Brand →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
