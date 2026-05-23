import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Projects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  const { data: projects } = await supabase
    .from('applications')
    .select('*, campaigns(id, title, platforms, niches, brand_profiles(id, brand_name))')
    .eq('creator_id', creator.id)
    .eq('status', 'selected')
    .order('updated_at', { ascending: false })

  const { data: myConvos } = await supabase.from('conversations').select('id, brand_id').eq('creator_id', creator.id)
  const convoByBrand = Object.fromEntries(myConvos?.map(c => [c.brand_id, c.id]) ?? [])

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
          {projects.map((p: any) => {
            const convoId = convoByBrand[p.campaigns?.brand_profiles?.id]
            return (
              <div key={p.id} className="bg-white rounded-[20px] p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] flex-shrink-0">
                    {p.campaigns?.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-[13px] text-[#6A6C6A]">{p.campaigns?.brand_profiles?.brand_name}</p>
                    <p className="text-[17px] font-black text-[#121511]">{p.campaigns?.title}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.campaigns?.platforms?.map((pl: string) => <span key={pl} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{pl}</span>)}
                </div>
                <div className="flex items-center gap-3 text-[13px] text-[#6A6C6A] mb-4">
                  <span className="w-2 h-2 bg-[#9FE870] rounded-full" />
                  <span>Selected on {new Date(p.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {convoId && (
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
