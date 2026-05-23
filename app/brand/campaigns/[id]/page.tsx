import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ApplicationActions } from './application-actions'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-[#F5F5F5] text-[#6A6C6A]',
  shortlisted: 'bg-blue-50 text-blue-700',
  selected: 'bg-[#9FE870]/20 text-[#163300]',
  rejected: 'bg-red-50 text-red-600',
}

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

  let appQuery = supabase.from('applications').select('*, creator_profiles(id, display_name, city, niches, instagram_followers, username)').eq('campaign_id', id).order('created_at', { ascending: false })
  if (filter !== 'all') appQuery = appQuery.eq('status', filter)
  const { data: applications } = await appQuery

  const counts = { all: 0, pending: 0, shortlisted: 0, selected: 0, rejected: 0 }
  applications?.forEach((a: any) => { counts.all++; counts[a.status as keyof typeof counts]++ })

  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link href="/brand/campaigns" className="text-[13px] text-[#6A6C6A] hover:text-[#163300] mb-2 block">← Back to Campaigns</Link>
          <h1 className="text-[26px] font-black text-[#121511]">{campaign.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize ${campaign.status === 'open' ? 'bg-[#9FE870]/20 text-[#163300]' : campaign.status === 'draft' ? 'bg-[#F5F5F5] text-[#6A6C6A]' : 'bg-red-50 text-red-600'}`}>{campaign.status}</span>
            {campaign.budget_inr && <span className="text-[13px] text-[#6A6C6A]">₹{campaign.budget_inr.toLocaleString('en-IN')} budget</span>}
            {campaign.application_deadline && <span className="text-[13px] text-[#6A6C6A]">Deadline: {new Date(campaign.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
      </div>

      {campaign.goal && (
        <div className="bg-white rounded-[20px] p-5 mb-6">
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#6A6C6A] mb-2">Campaign Brief</p>
          <p className="text-[15px] text-[#121511] leading-relaxed">{campaign.goal}</p>
        </div>
      )}

      {/* Applicants */}
      <div className="bg-white rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-black text-[#121511]">Applicants</h2>
          <span className="text-[14px] font-semibold text-[#6A6C6A]">{counts.all} total</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'pending', 'shortlisted', 'selected', 'rejected'] as const).map(f => (
            <Link key={f} href={`/brand/campaigns/${id}?filter=${f}`}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold capitalize transition-colors ${filter === f ? 'bg-[#163300] text-[#9FE870]' : 'bg-[#EDEFEB] text-[#6A6C6A] hover:text-[#121511]'}`}>
              {f} {counts[f] > 0 ? `(${counts[f]})` : ''}
            </Link>
          ))}
        </div>

        {!applications?.length ? (
          <div className="text-center py-10">
            <p className="text-[40px] mb-3">📭</p>
            <p className="text-[15px] font-semibold text-[#121511]">No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <div key={app.id} className="border border-[#E8E8E8] rounded-[16px] p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[16px] flex-shrink-0">
                    {app.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-[15px] font-black text-[#121511]">{app.creator_profiles?.display_name ?? 'Creator'}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_COLOR[app.status]}`}>{app.status}</span>
                    </div>
                    <p className="text-[13px] text-[#6A6C6A] mb-1">{app.creator_profiles?.city}</p>
                    {app.creator_profiles?.instagram_followers && (
                      <p className="text-[13px] text-[#6A6C6A]">📸 {app.creator_profiles.instagram_followers.toLocaleString('en-IN')} followers</p>
                    )}
                    {app.proposed_rate_inr && <p className="text-[13px] font-semibold text-[#163300] mt-1">Proposed: ₹{app.proposed_rate_inr.toLocaleString('en-IN')}</p>}
                    {app.cover_note && <p className="text-[14px] text-[#4A4C4A] mt-2 line-clamp-2">{app.cover_note}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {app.creator_profiles?.username && (
                    <Link href={`/${app.creator_profiles.username}`} className="px-3 py-1.5 bg-[#EDEFEB] text-[#121511] text-[12px] font-semibold rounded-full hover:bg-[#E0E2DE] transition-colors">
                      View Profile
                    </Link>
                  )}
                  <ApplicationActions applicationId={app.id} creatorId={app.creator_profiles?.id} campaignId={id} brandId={brand.id} currentStatus={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
