import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-[#9FE870]/20 text-[#163300]',
  draft: 'bg-[#F5F5F5] text-[#6A6C6A]',
  closed: 'bg-red-50 text-red-600',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function DeadlineWarning({ dateStr }: { dateStr: string | null }) {
  const days = daysUntil(dateStr)
  if (days === null || days > 3 || days < 0) return null
  if (days === 0) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 flex-shrink-0">🔴 Last day!</span>
  if (days === 1) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 flex-shrink-0">⚠️ 1 day left</span>
  return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 flex-shrink-0">⚠️ {days} days left</span>
}

export default async function BrandCampaigns({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = 'all' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  // Auto-close any open campaigns whose application_deadline has passed
  const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD in UTC, close enough for IST MVP
  const { data: expired } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('brand_id', brand.id)
    .eq('status', 'open')
    .not('application_deadline', 'is', null)
    .lt('application_deadline', todayStr)

  if (expired?.length) {
    await supabase.from('campaigns')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .in('id', expired.map(c => c.id))

    // Notify the brand for each auto-closed campaign
    await supabase.from('notifications').insert(
      expired.map(c => ({
        user_id: user.id,
        type: 'campaign_auto_closed',
        message: `Your campaign "${c.title}" was automatically closed as the application deadline has passed.`,
        link: `/brand/campaigns/${c.id}`,
      }))
    )
  }

  const STATUS_ORDER: Record<string, number> = { open: 0, draft: 1, closed: 2 }

  let query = supabase.from('campaigns').select('*, applications(count)').eq('brand_id', brand.id).order('created_at', { ascending: false })
  if (filter !== 'all') query = query.eq('status', filter)
  const { data: raw } = await query

  const campaigns = filter === 'all' && raw
    ? [...raw].sort((a, b) => {
        const sp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
        if (sp !== 0) return sp
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    : raw

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
            className={`px-4 py-2 rounded-[10px] text-[14px] font-semibold capitalize transition-colors ${filter === f ? 'bg-[#EDEFEB] text-[#163300] font-bold' : 'text-[#6A6C6A] hover:text-[#121511]'}`}>
            {f}
          </Link>
        ))}
      </div>

      {!campaigns?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          {filter === 'all' && (
            <>
              <p className="text-[48px] mb-4">📣</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No campaigns yet</p>
              <p className="text-[15px] text-[#6A6C6A] mb-6">Post your first campaign to start receiving applications from creators.</p>
              <Link href="/brand/campaigns/new" className="bg-[#163300] text-[#9FE870] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">
                Post a Campaign →
              </Link>
            </>
          )}
          {filter === 'open' && (
            <>
              <p className="text-[48px] mb-4">📭</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No open campaigns</p>
              <p className="text-[15px] text-[#6A6C6A] mb-6">You don't have any live campaigns right now. Post one to start receiving applications.</p>
              <Link href="/brand/campaigns/new" className="bg-[#163300] text-[#9FE870] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">
                Post a Campaign →
              </Link>
            </>
          )}
          {filter === 'draft' && (
            <>
              <p className="text-[48px] mb-4">📝</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No drafts</p>
              <p className="text-[15px] text-[#6A6C6A]">Campaigns you save as draft will appear here.</p>
            </>
          )}
          {filter === 'closed' && (
            <>
              <p className="text-[48px] mb-4">🗂️</p>
              <p className="text-[18px] font-black text-[#121511] mb-2">No closed campaigns</p>
              <p className="text-[15px] text-[#6A6C6A]">Campaigns you close will be archived here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c: any) => {
            const appCount = c.applications?.[0]?.count ?? 0
            const days = c.status === 'open' ? daysUntil(c.application_deadline) : null
            const hasWarning = days !== null && days >= 0 && days <= 3
            return (
              <div key={c.id} className={`bg-white rounded-[20px] p-5 ${c.status === 'closed' ? 'opacity-60' : ''} ${hasWarning ? 'ring-1 ring-amber-200' : ''}`}>
                {/* Title row */}
                <div className="flex items-start justify-between gap-4 mb-0.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <h3 className="text-[17px] font-black text-[#121511]">{c.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize flex-shrink-0 ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                    {hasWarning && <DeadlineWarning dateStr={c.application_deadline} />}
                  </div>
                  {c.status !== 'closed' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/brand/campaigns/${c.id}/edit`} className="px-4 py-2 bg-[#EDEFEB] text-[#121511] text-[13px] font-semibold rounded-full hover:bg-[#E0E2DE] transition-colors">
                        Edit
                      </Link>
                      {c.status !== 'draft' && (
                        <Link href={`/brand/campaigns/${c.id}`} className="px-4 py-2 bg-[#9FE870] text-[#163300] text-[13px] font-bold rounded-full hover:bg-[#8fdc60] transition-colors">
                          View Applicants
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Warning explanation */}
                {hasWarning && (
                  <p className="text-[12px] text-amber-700 mb-2">
                    {days === 0
                      ? 'This campaign closes tonight. Extend the deadline in Edit if you need more time.'
                      : `This campaign will automatically close in ${days} day${days === 1 ? '' : 's'}. Edit the deadline to extend it.`}
                  </p>
                )}

                {/* Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {c.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}
                  {c.niches?.slice(0, 3).map((n: string) => <span key={n} className="text-[11px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{n}</span>)}
                  {c.status === 'draft' && !c.platforms?.length && <span className="inline-block bg-[#F0F0F0] rounded-full w-[76px] h-[24.16px]" />}
                  {c.status === 'draft' && !c.niches?.length && <span className="inline-block bg-[#F0F0F0] rounded-full w-[124px] h-[24.16px]" />}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#F0F0F0]">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A9C9A] mb-1">Budget</p>
                    <p className="text-[16px] font-black text-[#121511]">{c.budget_inr ? `₹${c.budget_inr.toLocaleString('en-IN')}` : <span className="text-[#D0D0D0]">—</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A9C9A] mb-1">Apply by</p>
                    <p className={`text-[16px] font-black ${hasWarning ? 'text-red-600' : 'text-[#121511]'}`}>
                      {c.application_deadline ? new Date(c.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : <span className="text-[#D0D0D0]">—</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A9C9A] mb-1">Deliver by</p>
                    <p className="text-[16px] font-black text-[#121511]">{c.content_deadline ? new Date(c.content_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : <span className="text-[#D0D0D0]">—</span>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A9C9A] mb-1">Applicants</p>
                    <p className={`text-[16px] font-black ${appCount > 0 ? 'text-[#163300]' : 'text-[#D0D0D0]'}`}>{appCount}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
