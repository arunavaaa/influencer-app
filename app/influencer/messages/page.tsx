'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ChevronRight } from 'lucide-react'

type ConversationRow = {
  id: string
  status: string
  agreed_price_inr: number
  brand_profiles: { company_name: string; logo_url: string | null } | null
  content_packages: { format: string; platform: string } | null
  last_message: string | null
  last_message_at: string | null
  unread: boolean
}

function fmtRelative(d: string | null) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function MessagesInboxPage() {
  const supabase = createClient()
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) { setLoading(false); return }

    // Get all contracts for this influencer
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, status, agreed_price_inr, brand_profiles(company_name, logo_url), content_packages(format, platform)')
      .eq('influencer_id', profile.id)
      .order('hired_at', { ascending: false })

    if (!contracts) { setLoading(false); return }

    // For each contract, get the last message
    const rows: ConversationRow[] = await Promise.all(
      contracts.map(async (c: any) => {
        const { data: msgs } = await supabase
          .from('messages')
          .select('body, sent_at, sender_id')
          .eq('contract_id', c.id)
          .order('sent_at', { ascending: false })
          .limit(1)

        const last = msgs?.[0]
        return {
          id: c.id,
          status: c.status,
          agreed_price_inr: c.agreed_price_inr,
          brand_profiles: c.brand_profiles,
          content_packages: c.content_packages,
          last_message: last?.body ?? null,
          last_message_at: last?.sent_at ?? null,
          unread: false,
        }
      })
    )

    // Sort: contracts with messages first, then by message date
    const withMessages = rows.filter(r => r.last_message_at).sort((a, b) =>
      new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime()
    )
    const withoutMessages = rows.filter(r => !r.last_message_at)

    setConversations([...withMessages, ...withoutMessages])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#163300] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      <div className="px-8 py-8">
        <div className="max-w-[640px]">
          <div className="mb-8">
            <h1 className="text-[30px] font-black text-[#121511]">Messages</h1>
            <p className="text-[15px] text-[#6A6C6A] mt-1">Chat with brands about your active deals.</p>
          </div>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-[24px] p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#EDEFEB] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-[#B0B2AF]" />
              </div>
              <p className="text-[18px] font-black text-[#121511] mb-2">No conversations yet</p>
              <p className="text-[14px] text-[#6A6C6A]">Once you have active orders, you can message brands here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] overflow-hidden">
              {conversations.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-[#EDEFEB] transition-colors ${i < conversations.length - 1 ? 'border-b border-[#E8E8E8]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[13px] font-black flex-shrink-0 overflow-hidden">
                    {c.brand_profiles?.logo_url
                      ? <img src={c.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                      : (c.brand_profiles?.company_name?.[0] || 'B').toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-bold text-[#121511] truncate">
                        {c.brand_profiles?.company_name || 'Brand'}
                      </p>
                      {c.last_message_at && (
                        <p className="text-[11px] text-[#B0B2AF] flex-shrink-0">{fmtRelative(c.last_message_at)}</p>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6A6C6A] truncate mt-0.5">
                      {c.last_message
                        ? c.last_message
                        : <span className="text-[#B0B2AF]">No messages yet — start the conversation</span>
                      }
                    </p>
                    <p className="text-[11px] text-[#B0B2AF] mt-0.5 capitalize">
                      {[c.content_packages?.format, c.agreed_price_inr ? `₹${c.agreed_price_inr.toLocaleString('en-IN')}` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#B0B2AF] flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
