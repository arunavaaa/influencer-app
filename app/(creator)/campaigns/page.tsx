import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CampaignActions } from './apply-modal'

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function BrowseCampaigns({ searchParams }: { searchParams: Promise<{ niche?: string; platform?: string; sort?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  // Only show open campaigns whose deadline hasn't passed yet (or have no deadline)
  const todayStr = new Date().toISOString().split('T')[0]
  let query = supabase
    .from('campaigns')
    .select('*, created_at, updated_at, brand_profiles(brand_name, niche, city, logo_url, user_id)')
    .eq('status', 'open')
    .or(`application_deadline.is.null,application_deadline.gte.${todayStr}`)
  if (sp.niche) query = query.contains('niches', [sp.niche])
  if (sp.platform) query = query.contains('platforms', [sp.platform])

  const order = sp.sort === 'budget' ? 'budget_inr' : 'created_at'
  const { data: campaigns } = await query.order(order, { ascending: false })

  const { data: myApps } = await supabase.from('applications').select('campaign_id').eq('creator_id', creator.id)
  const appliedIds = new Set(myApps?.map(a => a.campaign_id) ?? [])

  return (
    <div className="p-6 md:p-8 max-w-[1000px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">Browse Campaigns</h1>

      {!campaigns?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">📣</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No open campaigns right now</p>
          <p className="text-[15px] text-[#6A6C6A]">Check back soon — brands post new campaigns regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c: any) => {
            const applied = appliedIds.has(c.id)
            const wasEdited = c.updated_at && c.created_at &&
              (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) > 5 * 60 * 1000
            const days = daysUntil(c.application_deadline)
            const hasWarning = days !== null && days >= 0 && days <= 3
            return (
              <div key={c.id} className={`bg-white rounded-[20px] p-5 border transition-colors flex flex-col ${hasWarning ? 'border-amber-200 hover:border-amber-300' : 'border-transparent hover:border-[#163300]/30'}`}>
                {/* Brand + title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0 overflow-hidden">
                    {c.brand_profiles?.logo_url
                      ? <img src={c.brand_profiles.logo_url} alt={c.brand_profiles.brand_name} className="w-full h-full object-cover" />
                      : c.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] text-[#6A6C6A] truncate">{c.brand_profiles?.brand_name}</p>
                      {wasEdited && <span className="text-[10px] font-bold text-[#9A9C9A] bg-[#F5F5F5] px-2 py-0.5 rounded-full flex-shrink-0">Updated</span>}
                      {hasWarning && (
                        days === 0
                          ? <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0">🔴 Last day to apply!</span>
                          : <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">⚠️ {days} day{days === 1 ? '' : 's'} left</span>
                      )}
                    </div>
                    <p className="text-[16px] font-black text-[#121511] leading-tight">{c.title}</p>
                  </div>
                </div>

                {/* Description */}
                {c.goal && (
                  <p className="text-[13px] text-[#4A4C4A] leading-relaxed mb-3 line-clamp-3">{c.goal}</p>
                )}

                {/* Tags — platforms, deliverable formats, niches */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                  {c.deliverable_formats?.map((f: string) => <span key={f} className="text-[11px] px-2 py-0.5 bg-[#F5F0FF] text-purple-700 rounded-full font-semibold">{f}</span>)}
                  {c.niches?.slice(0, 2).map((n: string) => <span key={n} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">{n}</span>)}
                </div>

                {/* Budget + deadlines */}
                <div className="mb-4 space-y-0.5">
                  {c.budget_inr
                    ? <p className="text-[14px] font-bold text-[#163300]">₹{c.budget_inr.toLocaleString('en-IN')} budget</p>
                    : <p className="text-[13px] text-[#9A9C9A]">Budget not specified</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {c.application_deadline && (
                      <p className={`text-[12px] font-semibold ${hasWarning ? 'text-red-600' : 'text-[#9A9C9A]'}`}>
                        Apply by {new Date(c.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {c.content_deadline && <p className="text-[12px] text-[#9A9C9A]">Deliver by {new Date(c.content_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  </div>
                </div>

                {/* Action */}
                <div className="mt-auto">
                  {applied
                    ? <div className="w-full py-2.5 bg-[#9FE870]/20 text-[#163300] text-[13px] font-bold rounded-full text-center">Applied ✓</div>
                    : <CampaignActions
                        campaignId={c.id}
                        creatorId={creator.id}
                        brandUserId={c.brand_profiles?.user_id ?? null}
                        campaign={{
                          title: c.title,
                          goal: c.goal,
                          platforms: c.platforms,
                          deliverable_formats: c.deliverable_formats,
                          niches: c.niches,
                          budget_inr: c.budget_inr,
                          application_deadline: c.application_deadline,
                          content_deadline: c.content_deadline,
                          brand_name: c.brand_profiles?.brand_name,
                        }}
                      />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
