import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApplyModal } from './apply-modal'

export default async function BrowseCampaigns({ searchParams }: { searchParams: Promise<{ niche?: string; platform?: string; sort?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  let query = supabase.from('campaigns').select('*, brand_profiles(brand_name, niche, city, logo_url)').eq('status', 'open')
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
            return (
              <div key={c.id} className="bg-white rounded-[20px] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                    {c.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-[#6A6C6A] truncate">{c.brand_profiles?.brand_name}</p>
                    <p className="text-[16px] font-black text-[#121511] leading-tight">{c.title}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                  {c.niches?.slice(0, 2).map((n: string) => <span key={n} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">{n}</span>)}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {c.budget_inr ? <p className="text-[14px] font-bold text-[#163300]">₹{c.budget_inr.toLocaleString('en-IN')} budget</p> : <p className="text-[13px] text-[#9A9C9A]">Budget not specified</p>}
                    {c.application_deadline && <p className="text-[12px] text-[#9A9C9A]">Apply by {new Date(c.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  </div>
                </div>
                {applied
                  ? <div className="w-full py-2.5 bg-[#9FE870]/20 text-[#163300] text-[13px] font-bold rounded-full text-center">Applied ✓</div>
                  : <ApplyModal campaignId={c.id} creatorId={creator.id} campaignTitle={c.title} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
