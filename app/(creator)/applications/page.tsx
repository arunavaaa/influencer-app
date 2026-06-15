import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageBrandButton } from './message-brand-button'
import { CampaignBriefModal } from './campaign-brief-modal'
import { AutoRefresh } from '@/components/ui/auto-refresh'

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

  // Mark all application activity notifications as read
  await supabase.from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .in('type', ['shortlisted', 'selected', 'rejected'])
    .eq('read', false)

  let query = supabase.from('applications').select('*, campaigns(id, title, goal, platforms, niches, deliverable_formats, budget_inr, application_deadline, content_deadline, brand_id, brand_profiles(brand_name, logo_url))').eq('creator_id', creator.id).order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('status', filter)
  const { data: applications } = await query

  // Total across all statuses — needed for contextual empty states
  const { count: totalCount } = await supabase.from('applications').select('id', { count: 'exact', head: true }).eq('creator_id', creator.id)
  const hasAnyApplications = (totalCount ?? 0) > 0

  // Key: brand_profiles.id → conversation id
  const { data: myConvos } = await supabase.from('conversations').select('id, brand_id').eq('creator_id', creator.id)
  const convoByBrand = Object.fromEntries(myConvos?.map(c => [c.brand_id, c.id]) ?? [])

  return (
    <div className="p-6 md:p-8 max-w-[800px]">
      <AutoRefresh />
      <h1 className="text-[28px] font-black text-[#121511] mb-6">My Applications</h1>

      <div className="flex gap-2 mb-6 bg-white rounded-[14px] p-1 w-fit flex-wrap">
        {['all', 'pending', 'shortlisted', 'selected', 'rejected'].map(f => (
          <Link key={f} href={`/applications?filter=${f}`}
            className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold capitalize transition-colors ${filter === f ? 'bg-[#EDEFEB] text-[#163300] font-bold' : 'text-[#6A6C6A] hover:text-[#121511]'}`}>
            {f}
          </Link>
        ))}
      </div>

      {!applications?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          {!hasAnyApplications || filter === 'all' ? (
            // Truly no applications at all
            <>
              <p className="text-[48px] mb-4">📋</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No applications yet</p>
              <p className="text-[15px] text-[#6A6C6A] mb-6">Browse open campaigns and hit Apply to get started.</p>
              <Link href="/campaigns" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">Browse Campaigns →</Link>
            </>
          ) : filter === 'pending' ? (
            <>
              <p className="text-[48px] mb-4">⏳</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No pending applications</p>
              <p className="text-[15px] text-[#6A6C6A]">Applications waiting for a brand's response will appear here.</p>
            </>
          ) : filter === 'shortlisted' ? (
            <>
              <p className="text-[48px] mb-4">⭐</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">Not shortlisted yet</p>
              <p className="text-[15px] text-[#6A6C6A] mb-6">When a brand shortlists you for a campaign, it'll show up here. Keep applying!</p>
              <Link href="/campaigns" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">Browse Campaigns →</Link>
            </>
          ) : filter === 'selected' ? (
            <>
              <p className="text-[48px] mb-4">🏆</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No selections yet</p>
              <p className="text-[15px] text-[#6A6C6A]">When a brand picks you for a campaign, you'll see it here. Hang tight!</p>
            </>
          ) : filter === 'rejected' ? (
            <>
              <p className="text-[48px] mb-4">🎉</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No rejections — keep it up!</p>
              <p className="text-[15px] text-[#6A6C6A]">None of your applications have been rejected. You're doing great.</p>
            </>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => {
            const cfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
            const c = app.campaigns
            const brandId = c?.brand_id
            const convoId = brandId ? (convoByBrand[brandId] ?? null) : null
            const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

            return (
              <div key={app.id} className="bg-white rounded-[20px] p-5">

                {/* Header — brand + title + status */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0 overflow-hidden">
                      {c?.brand_profiles?.logo_url
                        ? <img src={c.brand_profiles.logo_url} alt={c.brand_profiles.brand_name ?? ''} className="w-full h-full object-cover" />
                        : c?.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-[12px] text-[#6A6C6A] font-medium">
                        {c?.brand_profiles?.brand_name ?? <span className="italic">Brand unavailable</span>}
                      </p>
                      <p className="text-[17px] font-black text-[#121511]">
                        {c?.title ?? <span className="font-semibold text-[#9A9C9A]">Campaign no longer available</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize flex-shrink-0 ${cfg.color}`}>{app.status}</span>
                </div>

                {/* Status message */}
                {cfg.msg && (
                  <div className="bg-[#EDEFEB] rounded-[10px] px-3 py-2 mb-4">
                    <p className="text-[13px] font-bold text-[#163300]">{cfg.msg}</p>
                  </div>
                )}

                {/* If campaign was deleted, show what we still know from the application row */}
                {!c ? (
                  <>
                    <div className="bg-[#F9F9F9] rounded-[10px] px-3 py-2.5 mb-4">
                      <p className="text-[12px] text-[#9A9C9A]">Campaign details are no longer available.</p>
                    </div>
                    {app.proposed_rate_inr && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-[#F9F9F9] rounded-[12px] px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9C9A] mb-0.5">Your Proposed Rate</p>
                          <p className="text-[16px] font-black text-[#121511]">₹{app.proposed_rate_inr.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    )}
                    <div className="text-[12px] text-[#6A6C6A] mb-4">
                      <span>Applied on <strong className="text-[#121511]">{fmtDate(app.created_at)}</strong></span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Campaign goal */}
                    {c.goal && (
                      <div className="mb-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9A9C9A] mb-1">Campaign Brief</p>
                        <CampaignBriefModal brief={c.goal} />
                      </div>
                    )}

                    {/* Platforms + formats + niches */}
                    {((c.platforms?.length ?? 0) > 0 || (c.deliverable_formats?.length ?? 0) > 0 || (c.niches?.length ?? 0) > 0) && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {c.platforms?.map((p: string) => (
                          <span key={p} className="text-[11px] px-2.5 py-1 bg-[#EDEFEB] text-[#163300] rounded-full font-semibold">{p}</span>
                        ))}
                        {c.deliverable_formats?.map((f: string) => (
                          <span key={f} className="text-[11px] px-2.5 py-1 bg-[#F0EDFF] text-[#5B3FD9] rounded-full font-semibold">{f}</span>
                        ))}
                        {c.niches?.map((n: string) => (
                          <span key={n} className="text-[11px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">{n}</span>
                        ))}
                      </div>
                    )}

                    {/* Money row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {c.budget_inr && (
                        <div className="bg-[#F9F9F9] rounded-[12px] px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9C9A] mb-0.5">Brand's Budget</p>
                          <p className="text-[16px] font-black text-[#163300]">₹{c.budget_inr.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                      {app.proposed_rate_inr && (
                        <div className="bg-[#F9F9F9] rounded-[12px] px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9C9A] mb-0.5">Your Proposed Rate</p>
                          <p className="text-[16px] font-black text-[#121511]">₹{app.proposed_rate_inr.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>

                    {/* Dates row */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-[12px] text-[#6A6C6A]">
                      <span>Applied on <strong className="text-[#121511]">{fmtDate(app.created_at)}</strong></span>
                      {c.application_deadline && (
                        <span>Apply by <strong className="text-[#121511]">{fmtDate(c.application_deadline)}</strong></span>
                      )}
                      {c.content_deadline && (
                        <span>Content due <strong className="text-[#121511]">{fmtDate(c.content_deadline)}</strong></span>
                      )}
                    </div>
                  </>
                )}

                {/* Message button */}
                {brandId && (
                  <MessageBrandButton
                    creatorId={creator.id}
                    brandId={brandId}
                    campaignId={c?.id}
                    existingConvoId={convoId}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
