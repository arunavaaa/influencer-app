'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Send, AlertTriangle } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { describeReasons, scanAndRedact } from '@/lib/content-scanner'

export type Message = {
  id: string
  contract_id: string
  sender_id: string
  body: string
  is_flagged: boolean | null
  is_redacted: boolean | null
  flag_reason: string | null
  sent_at: string | null
}

function formatTime(d: string | null) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDate(d: string | null) {
  if (!d) return ''
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function Chat({
  contractId,
  currentUserId,
  counterpartName,
  initialMessages,
}: {
  contractId: string
  currentUserId: string
  counterpartName: string
  initialMessages: Message[]
}) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [lastRedaction, setLastRedaction] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${contractId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `contract_id=eq.${contractId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const { redactedBody, flagged, reasons } = scanAndRedact(trimmed)
      const flagReason = flagged ? reasons.join(', ') : null

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
          contract_id: contractId,
          sender_id: currentUserId,
          body: redactedBody,
          is_flagged: flagged,
          is_redacted: flagged,
          flag_reason: flagReason,
        })
        .select('id, contract_id, sender_id, body, is_flagged, is_redacted, flag_reason, sent_at')
        .single<Message>()

      if (error || !inserted) {
        toast.error(error?.message ?? 'Could not send message.')
        return
      }

      setMessages(prev => prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted])
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      if (flagged) {
        const { data: me } = await supabase
          .from('users')
          .select('strike_count')
          .eq('id', currentUserId)
          .single<{ strike_count: number | null }>()
        if (me) {
          await supabase.from('users').update({ strike_count: (me.strike_count ?? 0) + 1 }).eq('id', currentUserId)
        }
        setLastRedaction(describeReasons(reasons))
      } else {
        setLastRedaction(null)
      }
    } finally {
      setSending(false)
    }
  }

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const m of messages) {
    const d = formatDate(m.sent_at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) {
      last.msgs.push(m)
    } else {
      grouped.push({ date: d, msgs: [m] })
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Redaction warning */}
      {lastRedaction && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-yellow-800">Your last message was redacted</p>
              <p className="text-[12px] text-yellow-700 mt-0.5">
                We detected {lastRedaction}. Sharing off-platform contact info is against the rules.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastRedaction(null)}
            className="text-yellow-600 hover:text-yellow-800 text-[13px] flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center py-16">
            <div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Send className="w-5 h-5 text-[#B0B2AF]" />
              </div>
              <p className="text-[15px] font-bold text-[#121511] mb-1">Start the conversation</p>
              <p className="text-[13px] text-[#6A6C6A]">
                Say hi to {counterpartName}. All messages are monitored for off-platform contact sharing.
              </p>
            </div>
          </div>
        ) : (
          <>
            {grouped.map(group => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#E8E8E8]" />
                  <span className="text-[11px] font-semibold text-[#B0B2AF] px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-[#E8E8E8]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  {group.msgs.map((m) => {
                    const mine = m.sender_id === currentUserId
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[72%] rounded-[18px] px-4 py-2.5 ${
                            mine
                              ? 'bg-[#163300] text-white rounded-br-[4px]'
                              : 'bg-white text-[#121511] rounded-bl-[4px] shadow-sm'
                          }`}
                        >
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] ${mine ? 'text-[#9FE870]/70 justify-end' : 'text-[#B0B2AF]'}`}>
                            <span>{formatTime(m.sent_at)}</span>
                            {m.is_redacted && <span className="uppercase tracking-wide">· redacted</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-[#E8E8E8] px-6 py-4 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-end gap-3 max-w-[720px] mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize() }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e as unknown as React.FormEvent)
              }
            }}
            placeholder={`Message ${counterpartName}…`}
            rows={1}
            disabled={sending}
            className="flex-1 resize-none bg-[#EDEFEB] rounded-[14px] px-4 py-3 text-[14px] text-[#121511] placeholder-[#B0B2AF] outline-none focus:ring-2 focus:ring-[#163300]/20 transition-all overflow-hidden"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full bg-[#163300] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#1f4d00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
