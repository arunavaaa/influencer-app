'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'
import { Send } from 'lucide-react'

export function ChatBox({ conversationId, initialMessages, currentUserId, canChat }: {
  conversationId: string; initialMessages: Message[]; currentUserId: string; canChat: boolean
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  async function send() {
    const content = input.trim()
    if (!content || !canChat) return
    setSending(true)
    setInput('')
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: currentUserId, content })
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId)
    setSending(false)
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
