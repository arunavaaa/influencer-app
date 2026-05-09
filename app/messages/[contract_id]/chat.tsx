'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { describeReasons, scanAndRedact } from '@/lib/content-scanner'
import { cn } from '@/lib/utils'

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
    return new Date(d).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${contractId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg],
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

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
        .select(
          'id, contract_id, sender_id, body, is_flagged, is_redacted, flag_reason, sent_at',
        )
        .single<Message>()

      if (error || !inserted) {
        console.error(error)
        toast.error(error?.message ?? 'Could not send message.')
        return
      }

      // Optimistic local append (Realtime will dedupe by id)
      setMessages((prev) =>
        prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted],
      )

      setInput('')

      if (flagged) {
        // Strike count: read current → write +1. Best-effort; race conditions
        // are acceptable for moderation. RLS must allow users to update their
        // own row.
        const { data: me } = await supabase
          .from('users')
          .select('strike_count')
          .eq('id', currentUserId)
          .single<{ strike_count: number | null }>()

        if (me) {
          await supabase
            .from('users')
            .update({ strike_count: (me.strike_count ?? 0) + 1 })
            .eq('id', currentUserId)
        }

        setLastRedaction(describeReasons(reasons))
      } else {
        setLastRedaction(null)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {lastRedaction && (
        <div className="bg-destructive/10 border-b border-destructive/30 px-8 py-3 flex items-start justify-between gap-4">
          <div className="text-sm">
            <p className="font-medium text-destructive">
              Your last message was redacted
            </p>
            <p className="text-muted-foreground">
              We detected {lastRedaction} in your message. Sharing off-platform
              contact info is against the rules — repeated attempts can lead to
              account suspension.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastRedaction(null)}
            className="text-muted-foreground hover:text-foreground text-sm shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">
                Say hi to {counterpartName}
              </p>
              <p>
                All messages are scanned. Off-platform contact info will be
                redacted automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl mx-auto">
            {messages.map((m) => {
              const mine = m.sender_id === currentUserId
              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex',
                    mine ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                      mine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 mt-0.5 text-[10px]',
                        mine ? 'opacity-80' : 'text-muted-foreground',
                      )}
                    >
                      <span>{formatTime(m.sent_at)}</span>
                      {m.is_redacted && (
                        <span className="uppercase tracking-wide">
                          · redacted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="border-t bg-background px-4 sm:px-8 py-3"
      >
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e as unknown as React.FormEvent)
              }
            }}
            placeholder={`Message ${counterpartName}…`}
            rows={1}
            className="resize-none min-h-9"
            disabled={sending}
          />
          <Button type="submit" disabled={!input.trim() || sending}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  )
}
