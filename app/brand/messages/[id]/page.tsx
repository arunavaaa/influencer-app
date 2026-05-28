import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ChatBox } from './chat-box'

export default async function BrandChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!brand) redirect('/onboarding/brand')

  const { data: convo } = await supabase
    .from('conversations')
    .select('*, creator_profiles(id, display_name, username, city)')
    .eq('id', id).eq('brand_id', brand.id).maybeSingle()
  if (!convo) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const pending = convo.creator_accepted === null
  const declined = convo.creator_accepted === false

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link href="/brand/messages" className="flex items-center gap-1.5 text-[13px] text-[#6A6C6A] hover:text-[#163300] transition-colors flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" /> Messages
        </Link>
        <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px]">
          {convo.creator_profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#121511]">{convo.creator_profiles?.display_name}</p>
          {convo.creator_profiles?.username && (
            <Link href={`/${convo.creator_profiles.username}`} className="text-[12px] text-[#163300] hover:underline">View profile →</Link>
          )}
        </div>
      </div>

      {/* Status banners */}
      {pending && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 text-[14px] text-amber-800 font-medium flex-shrink-0">
          ⏳ Message request pending — waiting for creator to accept.
        </div>
      )}
      {declined && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 text-[14px] text-red-700 font-medium flex-shrink-0">
          ✗ Creator declined this message request.
        </div>
      )}

      {/* Chat */}
      <ChatBox conversationId={id} initialMessages={messages ?? []} currentUserId={user.id} canChat={!pending && !declined} />
    </div>
  )
}
