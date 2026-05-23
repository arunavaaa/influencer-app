import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-[#9FE870]/20 text-[#163300]',
  draft: 'bg-[#F5F5F5] text-[#6A6C6A]',
  closed: 'bg-red-50 text-red-600',
}

export default async function BrandCampaigns({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  let query = supabase.from('campaigns').select('*, applications(count)').eq('brand_id', brand.id).order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('status', filter)
  const { data: campaigns } = await query

  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-black text-[#121511]">My Campaigns</h1>
        <Link href="/brand/campaigns/new" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors">
          + Post Campaign
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-[14px] p-1 w-fit">
        {['all', 'open', 'draft', 'closed'].map(f => (
          <Link key={f} href={`/brand/campaigns?filter=${f}`}
            className={`px-4 py-2 rounded-[10px] text-[14px] font-semibold capitalize transition-colors ${filter === f ? 'bg-[#163300] text-[#9FE870]' : 'text-[#6A6C6A] hover:text-[#121511]'}`}>
            {f}
          </Link>
        ))}
      </div>

      {!campaigns?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">📣</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No campaigns yet</p>
          <p className="text-[15px] text-[#6A6C6A] mb-6">Post your first campaign to start receiving applications from creators.</p>
          <Link href="/brand/campaigns/new" className="bg-[#163300] text-[#9FE870] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">
            Post a Campaign →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c: any) => {
            const appCount = c.applications?.[0]?.count ?? 0
            return (
              <div key={c.id} className="bg-white rounded-[20px] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-[17px] font-black text-[#121511]">{c.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {c.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                      {c.niches?.slice(0, 2).map((n: string) => <span key={n} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{n}</span>)}
                    </div>
                    <div className="flex items-center gap-4 text-[13px] text-[#6A6C6A]">
                      {c.budget_inr && <span>₹{c.budget_inr.toLocaleString('en-IN')} budget</span>}
                      {c.application_deadline && <span>Due {new Date(c.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      <span className="font-semibold text-[#163300]">{appCount} applicant{appCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/brand/campaigns/${c.id}`} className="px-4 py-2 bg-[#163300] text-[#9FE870] text-[13px] font-bold rounded-full hover:bg-[#1f4a00] transition-colors">
                    View Applicants
                  </Link>
                  <Link href={`/brand/campaigns/${c.id}/edit`} className="px-4 py-2 bg-[#EDEFEB] text-[#121511] text-[13px] font-semibold rounded-full hover:bg-[#E0E2DE] transition-colors">
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
