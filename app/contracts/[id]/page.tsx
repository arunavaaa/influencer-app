import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { processExpiredSubmissionsForContract } from './actions'
import { ContractView, type Submission, type Transaction } from './contract-view'

type ContractRow = {
  id: string
  agreed_price_inr: number
  status: string | null
  non_circumvention_expiry: string | null
  created_at: string | null
  campaigns: { id: string; title: string | null } | null
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

function formatDate(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Lazy auto-approval pass on every visit (idempotent).
  await processExpiredSubmissionsForContract(id)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select(
      `id, agreed_price_inr, status, non_circumvention_expiry, created_at,
       campaigns ( id, title ),
       brand_profiles ( id, user_id, company_name ),
       influencer_profiles ( id, user_id, display_name )`,
    )
    .eq('id', id)
    .single<ContractRow>()

  if (contractError || !contract) notFound()

  const isBrand = contract.brand_profiles?.user_id === user.id
  const isInfluencer = contract.influencer_profiles?.user_id === user.id
  if (!isBrand && !isInfluencer) notFound()

  const { data: submissions } = await supabase
    .from('content_submissions')
    .select(
      'id, contract_id, file_url, submitted_at, auto_approve_at, status, brand_feedback, revision_number',
    )
    .eq('contract_id', id)
    .order('submitted_at', { ascending: false })
    .returns<Submission[]>()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, contract_id, type, amount_inr, status, created_at')
    .eq('contract_id', id)
    .order('created_at', { ascending: true })
    .returns<Transaction[]>()

  const role: 'brand' | 'influencer' = isBrand ? 'brand' : 'influencer'

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3">
          <Link href={isBrand ? '/brand/campaigns' : '/influencer/campaigns'}>
            ← Back
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">
              {contract.campaigns?.title ?? 'Untitled campaign'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {contract.brand_profiles?.company_name ?? 'Brand'}
              {' · '}
              {contract.influencer_profiles?.display_name ?? 'Influencer'}
              {' · '}signed {formatDate(contract.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {contract.status ?? 'pending'}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href={`/messages/${contract.id}`}>Open chat</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl">
        <ContractView
          contractId={contract.id}
          contractStatus={contract.status ?? 'active'}
          agreedPriceInr={contract.agreed_price_inr}
          nonCircumventionExpiry={contract.non_circumvention_expiry}
          role={role}
          currentUserId={user.id}
          influencerProfileId={contract.influencer_profiles?.id ?? null}
          submissions={submissions ?? []}
          transactions={transactions ?? []}
        />
      </div>
    </div>
  )
}
