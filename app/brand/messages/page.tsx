import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BrandMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  const { data: convos } = await supabase
    .from('conversations')
    .select('id, creator_accepted, last_message_at, creator_profiles(display_name, username, city, profile_photo_url), messages(content, created_at)')
    .eq('brand_id', brand.id)
    .order('last_message_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-[700px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">Messages</h1>
      {!convos?.length ? (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">💬</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No messages yet</p>
          <p className="text-[15px] text-[#6A6C6A] mb-6">Search for creators and send them a message, or select a creator from your campaign applicants.</p>
          <Link href="/brand/search" className="bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1f4a00] transition-colors inline-block">Search Creators →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] overflow-hidden">
          {convos.map((c: any, i: number) => {
            const lastMsg = c.messages?.[0]
            const pending = c.creator_accepted === null
            const declined = c.creator_accepted === false
            return (
              <Link key={c.id} href={`/brand/messages/${c.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-100 transition-colors ${i > 0 ? 'border-t border-[#F0F0F0]' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[16px] flex-shrink-0 overflow-hidden">
                  {c.creator_profiles?.profile_photo_url
                    ? <img src={c.creator_profiles.profile_photo_url} alt={c.creator_profiles.display_name ?? ''} className="w-full h-full object-cover" />
                    : c.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-[#121511] truncate">{c.creator_profiles?.display_name ?? 'Creator'}</p>
                    {pending && <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold flex-shrink-0">Pending</span>}
                    {declined && <span className="text-[11px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold flex-shrink-0">Declined</span>}
                  </div>
                  <p className="text-[13px] text-[#6A6C6A] truncate">{pending ? 'Message request sent' : declined ? 'Creator declined this request' : (lastMsg?.content ?? 'No messages yet')}</p>
                </div>
                <p className="text-[12px] text-[#9A9C9A] flex-shrink-0">{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
