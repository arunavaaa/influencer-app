import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageBrandButton } from '../applications/message-brand-button'
import { CampaignBriefModal } from '../applications/campaign-brief-modal'

export default async function Projects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  const { data: projects } = await supabase
    .from('applications')
    .select('*, campaigns(id, title, goal, platforms, niches, deliverable_formats, budget_inr, application_deadline, content_deadline, brand_id, brand_profiles(brand_name, logo_url))')
    .eq('creator_id', creator.id)
    .eq('status', 'selected')
    .order('updated_at', { ascending: false })

  const { data: myConvos } = await supabase.from('conversations').select('id, brand_id').eq('creator_id', creator.id)
  const convoByBrand = Object.fromEntries(myConvos?.map(c => [c.brand_id, c.id]) ?? [])

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 md:p-8 max-w-[800px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">Active Projects</h1>

      {!projects?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">🎯</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No active projects yet</p>
          <p className="text-[15px] text-[#6A6C6A] mb-6">Once a brand selects you for a campaign, it appears here.</p>
          <Link href="/campaigns" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">
            Browse Campaigns →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((app: any) => {
            const c = app.campaigns
            const brandId = c?.brand_id
            const convoId = brandId ? (convoByBrand[brandId] ?? null) : null

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
                  <span className="px-3 py-1 rounded-full text-[12px] font-bold capitalize flex-shrink-0 bg-[#9FE870]/20 text-[#163300]">
                    Selected
                  </span>
                </div>

                {/* Selected banner */}
                <div className="bg-[#EDEFEB] rounded-[10px] px-3 py-2 mb-4">
                  <p className="text-[13px] font-bold text-[#163300]">✅ You've been selected!</p>
                </div>

                {/* Campaign details — hidden if campaign was deleted */}
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
                      <span>Selected on <strong className="text-[#121511]">{fmtDate(app.updated_at)}</strong></span>
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
                      <span>Selected on <strong className="text-[#121511]">{fmtDate(app.updated_at)}</strong></span>
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
