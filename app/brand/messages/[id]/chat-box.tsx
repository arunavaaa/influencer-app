'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'
import { Send, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type NudgeProps = { campaignId: string | null; creatorProfileId: string } | null

function getNudgeState(conversationId: string): { count: number; dismissedAt: number } {
  try {
    const stored = localStorage.getItem(`nudge_${conversationId}`)
    return stored ? JSON.parse(stored) : { count: 0, dismissedAt: 0 }
  } catch { return { count: 0, dismissedAt: 0 } }
}

function saveNudgeState(conversationId: string, state: { count: number; dismissedAt: number }) {
  try { localStorage.setItem(`nudge_${conversationId}`, JSON.stringify(state)) } catch {}
}

export function ChatBox({ conversationId, initialMessages, currentUserId, canChat, recipientUserId, recipientNotifLink, nudgeProps }: {
  conversationId: string; initialMessages: Message[]; currentUserId: string; canChat: boolean
  recipientUserId?: string; recipientNotifLink?: string
  nudgeProps?: NudgeProps
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [nudgeVisible, setNudgeVisible] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Determine nudge visibility from localStorage on mount
  useEffect(() => {
    if (!nudgeProps) return
    const { count, dismissedAt } = getNudgeState(conversationId)
    if (count >= 2) return // permanently dismissed
    if (count === 1) {
      const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60)
      if (hoursSince < 48) return // still in cooldown
    }
    setNudgeVisible(true)
  }, [conversationId, nudgeProps])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages(prev =>
          prev.some(m => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message]
        ))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  async function send() {
    const content = input.trim()
    if (!content || !canChat) return
    setSending(true)
    setInput('')
    const { data: newMsg } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
      .select()
      .single()
    if (newMsg) setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg as Message])
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId)
    // Notify recipient — one unread notification per conversation (not per message)
    if (recipientUserId && recipientNotifLink) {
      const { count } = await supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', recipientUserId)
        .eq('type', 'new_message')
        .eq('link', recipientNotifLink)
        .eq('read', false)
      if ((count ?? 0) === 0) {
        await supabase.from('notifications').insert({
          user_id: recipientUserId,
          type: 'new_message',
          message: 'You have a new message',
          link: recipientNotifLink,
          read: false,
        })
      }
    }
    setSending(false)
  }

  function dismissNudge() {
    const prev = getNudgeState(conversationId)
    saveNudgeState(conversationId, { count: prev.count + 1, dismissedAt: Date.now() })
    setNudgeVisible(false)
  }

  async function selectCreator() {
    if (!nudgeProps?.campaignId) return
    setSelecting(true)
    const { data: app } = await supabase
      .from('applications')
      .select('id')
      .eq('campaign_id', nudgeProps.campaignId)
      .eq('creator_id', nudgeProps.creatorProfileId)
      .maybeSingle()
    if (app) {
      const { error } = await supabase.from('applications').update({ status: 'selected', updated_at: new Date().toISOString() }).eq('id', app.id)
      if (!error) {
        toast.success('Creator marked as selected ✓')
        // Permanently hide nudge for this conversation
        saveNudgeState(conversationId, { count: 99, dismissedAt: Date.now() })
        setNudgeVisible(false)
      } else {
        toast.error('Could not update status')
      }
    } else {
      toast.error('Could not find application')
    }
    setSelecting(false)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && <p className="text-center text-[14px] text-[#9A9C9A] py-8">No messages yet. Say hello! 👋</p>}
        {messages.map(m => {
          const mine = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-[18px] text-[14px] leading-relaxed ${mine ? 'bg-[#163300] text-white rounded-br-[6px]' : 'bg-white text-[#121511] rounded-bl-[6px] border border-[#E8E8E8]'}`}>
                {m.content}
              </div>
            </div>
          )
        })}

        {/* Selection nudge card — appears at the bottom of the message stream */}
        {nudgeVisible && (
          <div className="flex justify-center my-2">
            <div className="bg-[#FFFBEB] border border-amber-200 rounded-[16px] px-4 py-3.5 w-full max-w-[400px] relative">
              <button
                onClick={dismissNudge}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 hover:bg-amber-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-[13px] font-black text-amber-900 mb-0.5 pr-6">Did you agree on a deal? 🤝</p>
              {nudgeProps?.campaignId ? (
                <>
                  <p className="text-[12px] text-amber-700 mb-3">Mark this creator as selected to track the collaboration.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={selectCreator}
                      disabled={selecting}
                      className="flex-1 py-2 bg-[#163300] text-[#9FE870] text-[12px] font-bold rounded-[10px] hover:bg-[#1f4a00] transition-colors disabled:opacity-60"
                    >
                      {selecting ? '...' : '✓ Select Creator'}
                    </button>
                    <button
                      onClick={dismissNudge}
                      disabled={selecting}
                      className="flex-1 py-2 bg-amber-100 text-amber-800 text-[12px] font-semibold rounded-[10px] hover:bg-amber-200 transition-colors disabled:opacity-60"
                    >
                      Not yet
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-amber-700 mb-3">Ask this creator to apply to one of your campaigns to track the collaboration.</p>
                  <div className="flex gap-2">
                    <Link
                      href="/brand/campaigns"
                      className="flex-1 py-2 bg-[#163300] text-[#9FE870] text-[12px] font-bold rounded-[10px] hover:bg-[#1f4a00] transition-colors text-center"
                    >
                      View Campaigns →
                    </Link>
                    <button
                      onClick={dismissNudge}
                      className="flex-1 py-2 bg-amber-100 text-amber-800 text-[12px] font-semibold rounded-[10px] hover:bg-amber-200 transition-colors"
                    >
                      Not yet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {canChat ? (
        <div className="bg-white border-t border-[#E8E8E8] px-4 py-3 flex gap-3 items-end flex-shrink-0">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 rounded-[14px] border border-[#E8E8E8] text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="w-10 h-10 bg-[#163300] text-[#9FE870] rounded-full flex items-center justify-center hover:bg-[#1f4a00] transition-colors disabled:opacity-40 flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-[#F5F5F5] border-t border-[#E8E8E8] px-6 py-3 text-[14px] text-[#9A9C9A] text-center flex-shrink-0">
          Chat is not available until the creator accepts your request.
        </div>
      )}
    </div>
  )
}
