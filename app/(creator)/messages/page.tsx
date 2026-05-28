import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CreatorMessages() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  const { data: convos } = await supabase
    .from('conversations')
    .select('id, creator_accepted, initiated_by, last_message_at, brand_profiles(brand_name, city, logo_url), messages(content, created_at)')
    .eq('creator_id', creator.id)
    .order('last_message_at', { ascending: false })

  const requests = convos?.filter(c => c.creator_accepted === null && c.initiated_by === 'brand') ?? []
  const chats = convos?.filter(c => c.creator_accepted === true) ?? []

  return (
    <div className="p-6 md:p-8 max-w-[700px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">Messages</h1>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[15px] font-black text-[#121511]">Connection Requests</h2>
            <span className="min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center">
              {requests.length > 99 ? '99+' : requests.length}
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-[20px] overflow-hidden">
            {requests.map((c: any, i: number) => (
              <Link key={c.id} href={`/messages/${c.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-amber-100 transition-colors ${i > 0 ? 'border-t border-amber-200' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[16px] flex-shrink-0 overflow-hidden">
                  {c.brand_profiles?.logo_url
                    ? <img src={c.brand_profiles.logo_url} alt={c.brand_profiles.brand_name ?? ''} className="w-full h-full object-cover" />
                    : c.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-[#121511] truncate">{c.brand_profiles?.brand_name ?? 'Brand'}</p>
                    <span className="text-[11px] px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold flex-shrink-0">Awaiting response</span>
                  </div>
                  <p className="text-[13px] text-amber-700">Wants to connect with you — tap to accept or decline</p>
                </div>
                <span className="text-[20px] flex-shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active chats */}
      {chats.length > 0 && (
        <div>
          {requests.length > 0 && <h2 className="text-[15px] font-black text-[#121511] mb-3">Chats</h2>}
          <div className="bg-white rounded-[24px] overflow-hidden">
            {chats.map((c: any, i: number) => (
              <Link key={c.id} href={`/messages/${c.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-[#EDEFEB] transition-colors ${i > 0 ? 'border-t border-[#F0F0F0]' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[16px] flex-shrink-0 overflow-hidden">
                  {c.brand_profiles?.logo_url
                    ? <img src={c.brand_profiles.logo_url} alt={c.brand_profiles.brand_name ?? ''} className="w-full h-full object-cover" />
                    : c.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#121511] truncate">{c.brand_profiles?.brand_name ?? 'Brand'}</p>
                  <p className="text-[13px] text-[#6A6C6A] truncate">{c.messages?.[0]?.content ?? 'No messages yet'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!convos?.length && (
        <div className="bg-white rounded-[24px] p-16 text-center">
          <p className="text-[48px] mb-4">💬</p>
          <p className="text-[18px] font-black text-[#121511] mb-2">No messages yet</p>
          <p className="text-[15px] text-[#6A6C6A]">When brands message you or you reach out about a campaign, conversations will appear here.</p>
        </div>
      )}
    </div>
  )
}
