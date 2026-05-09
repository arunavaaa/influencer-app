'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ApprovalContext = {
  submissionId: string
  contractId: string
  agreedPriceInr: number
  actorId: string
  via: 'manual' | 'auto'
}

/**
 * Side effects shared by manual approval and 72h auto-approval:
 *   - flip contracts.status to 'completed'
 *   - insert influencer_payout (90%) and platform_fee (10%) transactions
 *   - write an audit_logs row
 *
 * Uses the admin client because brands shouldn't have direct INSERT on
 * `transactions` and `audit_logs` (those are platform-controlled).
 */
async function runApprovalSideEffects(ctx: ApprovalContext) {
  const admin = createAdminClient()

  const payoutAmount = Math.floor(ctx.agreedPriceInr * 0.9)
  const platformFee = ctx.agreedPriceInr - payoutAmount // ensures rupee total matches exactly

  // 1. mark contract completed
  const { error: contractError } = await admin
    .from('contracts')
    .update({ status: 'completed' })
    .eq('id', ctx.contractId)
  if (contractError) {
    console.error('[contract-complete]', contractError)
    throw new Error(`Could not complete contract: ${contractError.message}`)
  }

  // 2. insert the two transactions
  const { error: txError } = await admin.from('transactions').insert([
    {
      contract_id: ctx.contractId,
      type: 'influencer_payout',
      amount_inr: payoutAmount,
      status: 'released',
    },
    {
      contract_id: ctx.contractId,
      type: 'platform_fee',
      amount_inr: platformFee,
      status: 'captured',
    },
  ])
  if (txError) {
    console.error('[transactions-insert]', txError)
    throw new Error(`Could not insert transactions: ${txError.message}`)
  }

  // 3. audit log
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: ctx.actorId,
    action: 'contract_completed',
    entity_type: 'contract',
    entity_id: ctx.contractId,
    metadata: {
      submission_id: ctx.submissionId,
      via: ctx.via,
      payout_inr: payoutAmount,
      platform_fee_inr: platformFee,
    },
  })
  if (auditError) {
    // Don't fail the whole flow on audit log issues — log and continue.
    console.error('[audit-log]', auditError)
  }
}

async function getCallerBrandProfileId(): Promise<{
  userId: string
  brandProfileId: string
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!brand) return null

  return { userId: user.id, brandProfileId: brand.id }
}

export async function approveSubmission(submissionId: string) {
  const caller = await getCallerBrandProfileId()
  if (!caller) {
    return { ok: false, error: 'Not authorized.' as const }
  }

  const admin = createAdminClient()

  // Load the submission + contract together so we can authorize the brand,
  // grab agreed_price_inr, and bail if it's already in a terminal state.
  const { data: submission, error: loadError } = await admin
    .from('content_submissions')
    .select(
      'id, contract_id, status, contracts ( id, brand_id, agreed_price_inr )',
    )
    .eq('id', submissionId)
    .single<{
      id: string
      contract_id: string
      status: string
      contracts: { id: string; brand_id: string; agreed_price_inr: number } | null
    }>()

  if (loadError || !submission || !submission.contracts) {
    return { ok: false, error: 'Submission not found.' as const }
  }

  if (submission.contracts.brand_id !== caller.brandProfileId) {
    return { ok: false, error: 'Not authorized.' as const }
  }

  if (submission.status !== 'submitted') {
    return {
      ok: false,
      error: `Cannot approve a submission with status "${submission.status}".`,
    }
  }

  const { error: updateError } = await admin
    .from('content_submissions')
    .update({ status: 'approved' })
    .eq('id', submissionId)
  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  try {
    await runApprovalSideEffects({
      submissionId,
      contractId: submission.contracts.id,
      agreedPriceInr: submission.contracts.agreed_price_inr,
      actorId: caller.userId,
      via: 'manual',
    })
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }

  revalidatePath(`/contracts/${submission.contracts.id}`)
  return { ok: true as const }
}

export async function requestRevision(submissionId: string, feedback: string) {
  const trimmed = feedback.trim()
  if (trimmed.length < 5) {
    return { ok: false, error: 'Please provide feedback (min 5 chars).' }
  }

  const caller = await getCallerBrandProfileId()
  if (!caller) {
    return { ok: false, error: 'Not authorized.' as const }
  }

  const admin = createAdminClient()

  const { data: submission, error: loadError } = await admin
    .from('content_submissions')
    .select(
      'id, contract_id, status, revision_number, contracts ( id, brand_id )',
    )
    .eq('id', submissionId)
    .single<{
      id: string
      contract_id: string
      status: string
      revision_number: number | null
      contracts: { id: string; brand_id: string } | null
    }>()

  if (loadError || !submission || !submission.contracts) {
    return { ok: false, error: 'Submission not found.' }
  }

  if (submission.contracts.brand_id !== caller.brandProfileId) {
    return { ok: false, error: 'Not authorized.' as const }
  }

  if (submission.status !== 'submitted') {
    return {
      ok: false,
      error: `Cannot request revision on a submission with status "${submission.status}".`,
    }
  }

  const { error: updateError } = await admin
    .from('content_submissions')
    .update({ status: 'revision_requested', brand_feedback: trimmed })
    .eq('id', submissionId)
  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidatePath(`/contracts/${submission.contracts.id}`)
  return { ok: true as const }
}

/**
 * Lazy auto-approval pass. Called from the contract server page on every
 * load. For each submission past auto_approve_at and still in 'submitted',
 * flip to 'auto_approved' and run the same side effects as a manual
 * approval. The actor for the audit log is the influencer (so the influencer
 * is recorded as the party who triggered completion by submitting content
 * the brand never reviewed).
 *
 * Production-grade implementations would do this in pg_cron or a scheduled
 * Edge Function; this lazy pass is the MVP.
 */
export async function processExpiredSubmissionsForContract(contractId: string) {
  const admin = createAdminClient()

  const { data: expired, error } = await admin
    .from('content_submissions')
    .select(
      'id, contract_id, status, contracts ( id, agreed_price_inr, influencer_id, influencer_profiles ( user_id ) )',
    )
    .eq('contract_id', contractId)
    .eq('status', 'submitted')
    .lte('auto_approve_at', new Date().toISOString())
    .returns<
      {
        id: string
        contract_id: string
        status: string
        contracts: {
          id: string
          agreed_price_inr: number
          influencer_id: string
          influencer_profiles: { user_id: string } | null
        } | null
      }[]
    >()

  if (error) {
    console.error('[auto-approval-load]', error)
    return
  }
  if (!expired || expired.length === 0) return

  for (const submission of expired) {
    if (!submission.contracts) continue
    const actorId =
      submission.contracts.influencer_profiles?.user_id ?? null
    if (!actorId) continue

    const { error: updateError } = await admin
      .from('content_submissions')
      .update({ status: 'auto_approved' })
      .eq('id', submission.id)
    if (updateError) {
      console.error('[auto-approval-update]', updateError)
      continue
    }

    try {
      await runApprovalSideEffects({
        submissionId: submission.id,
        contractId: submission.contracts.id,
        agreedPriceInr: submission.contracts.agreed_price_inr,
        actorId,
        via: 'auto',
      })
    } catch (e) {
      console.error('[auto-approval-side-effects]', e)
    }
  }
}
