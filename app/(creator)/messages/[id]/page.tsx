import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ChatBox } from '@/app/brand/messages/[id]/chat-box'
import { AcceptRequest } from './accept-request'
import { AutoRefresh } from '@/components/ui/auto-refresh'

export default async function CreatorChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!creator) redirect('/onboarding/creator')

  const { data: convo } = await supabase
    .from('conversations')
    .select('*, brand_profiles(user_id, brand_name, city, website_url, logo_url)')
    .eq('id', id).eq('creator_id', creator.id).maybeSingle()
  if (!convo) notFound()

  const { data: messages } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true })

  // Mark any new_message notifications for this conversation as read
  await supabase.from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('type', 'new_message')
    .eq('link', `/messages/${id}`)
    .eq('read', false)

  const pending = convo.creator_accepted === null
  const canChat = convo.creator_accepted === true

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <Link href="/messages" className="flex items-center gap-1.5 text-[13px] text-[#6A6C6A] hover:text-[#163300] transition-colors flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" /> Messages
        </Link>
        <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[14px] overflow-hidden">
          {convo.brand_profiles?.logo_url
            ? <img src={convo.brand_profiles.logo_url} alt={convo.brand_profiles.brand_name ?? ''} className="w-full h-full object-cover" />
            : convo.brand_profiles?.brand_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#121511]">{convo.brand_profiles?.brand_name}</p>
          {convo.brand_profiles?.city && <p className="text-[12px] text-[#6A6C6A]">{convo.brand_profiles.city}</p>}
        </div>
      </div>

      {pending && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex-shrink-0">
          <p className="text-[14px] font-bold text-amber-800 mb-3">💬 {convo.brand_profiles?.brand_name} wants to connect with you</p>
          <AcceptRequest conversationId={id} />
        </div>
      )}
      {convo.creator_accepted === false && (
        <div className="bg-[#F5F5F5] border-b border-[#E8E8E8] px-6 py-3 text-[14px] text-[#6A6C6A] flex-shrink-0">
          You declined this message request.
        </div>
      )}

      <ChatBox
        conversationId={id}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        canChat={canChat}
        recipientUserId={convo.brand_profiles?.user_id ?? undefined}
        recipientNotifLink={`/brand/messages/${id}`}
      />
      {/* Re-run server components so badge counts reflect the mark-as-read above */}
      <AutoRefresh />
    </div>
  )
}
