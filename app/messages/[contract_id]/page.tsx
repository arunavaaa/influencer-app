import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { Chat, type Message } from './chat'

type ContractRow = {
  id: string
  agreed_price_inr: number | null
  status: string | null
  campaigns: {
    id: string
    title: string | null
  } | null
  brand_profiles: {
    id: string
    user_id: string
    company_name: string | null
  } | null
  influencer_profiles: {
    id: string
    user_id: string
    display_name: string | null
  } | null
}

function formatINR(n: number | null) {
  if (n == null) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ contract_id: string }>
}) {
  const { contract_id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(
      `id, agreed_price_inr, status,
       campaigns ( id, title ),
       brand_profiles ( id, user_id, company_name ),
       influencer_profiles ( id, user_id, display_name )`,
    )
    .eq('id', contract_id)
    .single<ContractRow>()

  if (contractError || !contract) notFound()

  const isBrand = contract.brand_profiles?.user_id === user.id
  const isInfluencer = contract.influencer_profiles?.user_id === user.id

  if (!isBrand && !isInfluencer) notFound()

  const counterpartName = isBrand
    ? contract.influencer_profiles?.display_name ?? 'Influencer'
    : contract.brand_profiles?.company_name ?? 'Brand'

  const { data: initialMessages, error: messagesError } = await supabase
    .from('messages')
    .select(
      'id, contract_id, sender_id, body, is_flagged, is_redacted, flag_reason, sent_at',
    )
    .eq('contract_id', contract_id)
    .order('sent_at', { ascending: true })
    .returns<Message[]>()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="border-b px-8 py-4">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-3">
          <Link href={isBrand ? '/brand/campaigns' : '/influencer/campaigns'}>
            ← Back
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">{counterpartName}</h1>
            <p className="text-sm text-muted-foreground">
              {contract.campaigns?.title ?? 'Untitled campaign'} ·{' '}
              {formatINR(contract.agreed_price_inr)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {contract.status ?? 'pending'}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={`/contracts/${contract.id}`}>View contract</Link>
            </Button>
          </div>
        </div>
      </div>

      {messagesError ? (
        <div className="p-8">
          <p className="text-sm text-destructive">
            Could not load messages: {messagesError.message}
          </p>
        </div>
      ) : (
        <Chat
          contractId={contract.id}
          currentUserId={user.id}
          counterpartName={counterpartName}
          initialMessages={initialMessages ?? []}
        />
      )}
    </div>
  )
}
