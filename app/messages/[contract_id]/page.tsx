import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Chat, type Message } from './chat'

type ContractRow = {
  id: string
  agreed_price_inr: number | null
  status: string | null
  campaigns: { id: string; title: string | null } | null
  brand_profiles: { id: string; user_id: string; company_name: string | null; logo_url: string | null } | null
  influencer_profiles: { id: string; user_id: string; display_name: string | null; profile_photo_url: string | null } | null
}

const STATUS_STYLES: Record<string, string> = {
  pending_acceptance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-[#EDEFEB] text-[#163300] border-[#C8E6A0]',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  counter_offered: 'bg-blue-50 text-blue-700 border-blue-200',
}

function fmtStatus(s: string | null) {
  if (!s) return 'Pending'
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ contract_id: string }>
}) {
  const { contract_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(`id, agreed_price_inr, status,
       campaigns ( id, title ),
       brand_profiles ( id, user_id, company_name, logo_url ),
       influencer_profiles ( id, user_id, display_name, profile_photo_url )`)
    .eq('id', contract_id)
    .single<ContractRow>()

  if (contractError || !contract) notFound()

  const isBrand = contract.brand_profiles?.user_id === user.id
  const isInfluencer = contract.influencer_profiles?.user_id === user.id
  if (!isBrand && !isInfluencer) notFound()

  const counterpartName = isBrand
    ? (contract.influencer_profiles?.display_name ?? 'Influencer')
    : (contract.brand_profiles?.company_name ?? 'Brand')

  const counterpartPhoto = isBrand
    ? contract.influencer_profiles?.profile_photo_url
    : contract.brand_profiles?.logo_url

  const backHref = isBrand ? '/brand/orders' : '/influencer/messages'

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('id, contract_id, sender_id, body, is_flagged, is_redacted, flag_reason, sent_at')
    .eq('contract_id', contract_id)
    .order('sent_at', { ascending: true })
    .returns<Message[]>()

  const statusStyle = STATUS_STYLES[contract.status ?? ''] ?? 'bg-[#EDEFEB] text-[#6A6C6A] border-[#E8E8E8]'
  const initial = counterpartName[0]?.toUpperCase() || '?'

  return (
    <div className="flex flex-col h-screen bg-[#EDEFEB]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] flex-shrink-0">
        <div className="px-6 py-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6A6C6A] hover:text-[#121511] transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {isBrand ? 'Back to Orders' : 'Back to Messages'}
          </Link>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[13px] font-black flex-shrink-0 overflow-hidden">
                {counterpartPhoto
                  ? <img src={counterpartPhoto} alt="" className="w-full h-full object-cover" />
                  : initial
                }
              </div>
              <div>
                <p className="text-[16px] font-black text-[#121511]">{counterpartName}</p>
                <p className="text-[12px] text-[#6A6C6A]">
                  {contract.campaigns?.title ?? 'Direct deal'}
                  {contract.agreed_price_inr != null && ` · ₹${contract.agreed_price_inr.toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${statusStyle}`}>
                {fmtStatus(contract.status)}
              </span>
              <Link
                href={`/influencer/orders/${contract.id}`}
                className="text-[12px] font-bold text-[#163300] px-3 py-1.5 rounded-[8px] border border-[#163300]/20 hover:bg-[#EDEFEB] transition-colors"
              >
                View Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Chat
        contractId={contract.id}
        currentUserId={user.id}
        counterpartName={counterpartName}
        initialMessages={initialMessages ?? []}
      />
    </div>
  )
}
