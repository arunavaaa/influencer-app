import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { ApplicationsPanel } from './applications-panel'

export default async function CampaignDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filter?: string }> }) {
  const { id } = await params
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).eq('brand_id', brand.id).maybeSingle()
  if (!campaign) notFound()

  // Counts from all applications (not filtered)
  const { data: allApps } = await supabase.from('applications').select('status').eq('campaign_id', id)
  const counts = { all: 0, pending: 0, shortlisted: 0, selected: 0, rejected: 0 }
  allApps?.forEach((a: any) => { counts.all++; counts[a.status as keyof typeof counts]++ })

  // Filtered applications for display
  let appQuery = supabase
    .from('applications')
    .select('id, status, cover_note, proposed_rate_inr, created_at, creator_profiles(id, display_name, city, niches, instagram_followers, username, profile_photo_url)')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })
  if (filter !== 'all') appQuery = appQuery.eq('status', filter)
  const { data: applications } = await appQuery

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr + 'T00:00:00')
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }
  const days = campaign.status === 'open' ? daysUntil(campaign.application_deadline) : null
  const hasWarning = days !== null && days >= 0 && days <= 3

  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      {/* Page header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <Link href="/brand/campaigns" className="flex items-center gap-1.5 text-[13px] text-[#6A6C6A] hover:text-[#163300] mb-2 w-fit transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> My Campaigns
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] font-black text-[#121511]">{campaign.title}</h1>
            <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize flex-shrink-0 ${campaign.status === 'open' ? 'bg-[#9FE870]/20 text-[#163300]' : campaign.status === 'draft' ? 'bg-[#F5F5F5] text-[#6A6C6A]' : 'bg-red-50 text-red-600'}`}>{campaign.status}</span>
          </div>
        </div>
        <Link href={`/brand/campaigns/${id}/edit`} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 border-2 border-[#163300]/20 rounded-full text-[13px] font-bold text-[#163300] hover:border-[#163300] transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Link>
      </div>

      {/* Deadline warning banner */}
      {hasWarning && (
        <div className={`flex items-start gap-3 rounded-[16px] px-4 py-3 mb-5 ${days === 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <span className="text-[20px] flex-shrink-0">{days === 0 ? '🔴' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] font-black ${days === 0 ? 'text-red-700' : 'text-amber-800'}`}>
              {days === 0 ? 'This campaign closes tonight!' : `${days} day${days === 1 ? '' : 's'} left — this campaign auto-closes on ${fmtDate(campaign.application_deadline!)}`}
            </p>
            <p className={`text-[12px] mt-0.5 ${days === 0 ? 'text-red-600' : 'text-amber-700'}`}>
              Once closed, creators can no longer apply. <Link href={`/brand/campaigns/${id}/edit`} className="underline font-semibold">Edit the deadline</Link> if you need more time.
            </p>
          </div>
        </div>
      )}

      {/* Campaign details card */}
      <div className="bg-white rounded-[24px] p-6 mb-5 space-y-5">
        {/* Goal / description */}
        {campaign.goal && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-1.5">Goal / Description</p>
            <p className="text-[15px] text-[#121511] leading-relaxed">{campaign.goal}</p>
          </div>
        )}

        {/* Platform · Format · Niche — equal-width columns side by side */}
        {((campaign.platforms?.length ?? 0) > 0 || (campaign.deliverable_formats?.length ?? 0) > 0 || (campaign.niches?.length ?? 0) > 0) && (
          <div className="grid grid-cols-3 gap-4">
            {/* Platform */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-2">Platform</p>
              {(campaign.platforms?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(campaign.platforms as string[]).map((p: string) => (
                    <span key={p} className="px-3 py-1 bg-[#F0F7EC] text-[#163300] text-[12px] font-bold rounded-full border border-[#163300]/15">{p}</span>
                  ))}
                </div>
              ) : <span className="text-[13px] text-[#C0C2C0]">—</span>}
            </div>

            {/* Deliverable Format */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-2">Deliverable Format</p>
              {(campaign.deliverable_formats?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(campaign.deliverable_formats as string[]).map((f: string) => (
                    <span key={f} className="px-3 py-1 bg-[#F0EDFF] text-[#5B3FD9] text-[12px] font-bold rounded-full">{f}</span>
                  ))}
                </div>
              ) : <span className="text-[13px] text-[#C0C2C0]">—</span>}
            </div>

            {/* Creator niche */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-2">Looking for Creators in</p>
              {(campaign.niches?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(campaign.niches as string[]).map((n: string) => (
                    <span key={n} className="px-3 py-1 bg-[#F5F5F5] text-[#4A4C4A] text-[12px] font-semibold rounded-full">{n}</span>
                  ))}
                </div>
              ) : <span className="text-[13px] text-[#C0C2C0]">—</span>}
            </div>
          </div>
        )}

        {/* Stats row — budget, apply by, deliver by */}
        {(campaign.budget_inr || campaign.application_deadline || campaign.content_deadline) && (
          <div className="flex gap-10 flex-wrap pt-5 mt-1 border-t border-[#F0F0F0]">
            {campaign.budget_inr && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-1">Budget</p>
                <p className="text-[20px] font-black text-[#163300] leading-tight">₹{campaign.budget_inr.toLocaleString('en-IN')}</p>
              </div>
            )}
            {campaign.application_deadline && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-1">Apply by</p>
                <p className="text-[16px] font-bold text-[#121511]">{fmtDate(campaign.application_deadline)}</p>
              </div>
            )}
            {campaign.content_deadline && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9A9C9A] mb-1">Deliver by</p>
                <p className="text-[16px] font-bold text-[#121511]">{fmtDate(campaign.content_deadline)}</p>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Applicants section */}
      <div className="bg-white rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-black text-[#121511]">Applicants</h2>
          <span className="text-[14px] font-semibold text-[#6A6C6A]">{counts.all} total</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'pending', 'shortlisted', 'selected', 'rejected'] as const).map(f => (
            <Link
              key={f}
              href={`/brand/campaigns/${id}?filter=${f}`}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold capitalize transition-colors ${filter === f ? 'bg-[#163300] text-[#9FE870] font-bold' : 'bg-[#EDEFEB] text-[#6A6C6A] hover:text-[#121511]'}`}
            >
              {f}{counts[f] > 0 ? ` (${counts[f]})` : ''}
            </Link>
          ))}
        </div>

        {/* Hint text */}
        <p className="text-[12px] text-[#9A9C9A] mb-4">Click "Review Application" to read the full cover note and take action.</p>

        <ApplicationsPanel
          applications={(applications ?? []) as any}
          campaignId={id}
          brandId={brand.id}
        />
      </div>
    </div>
  )
}
