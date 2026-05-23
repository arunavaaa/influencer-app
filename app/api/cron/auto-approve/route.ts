import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call (or a manual trigger with the secret)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Find all contracts past their auto-approve deadline
  const { data: contracts, error } = await admin
    .from('contracts')
    .select('id, agreed_price_inr, influencer_profiles ( user_id, display_name )')
    .eq('status', 'content_submitted')
    .lt('auto_approve_at', new Date().toISOString())

  if (error) {
    console.error('[cron/auto-approve] fetch error:', error)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  if (!contracts || contracts.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const ids = contracts.map(c => c.id)
  let processed = 0
  let failed = 0

  for (const contractId of ids) {
    // Update contract: auto_approved + release escrow
    const { error: contractErr } = await admin
      .from('contracts')
      .update({ status: 'auto_approved', escrow_status: 'released' })
      .eq('id', contractId)

    if (contractErr) { failed++; continue }

    // Mark the latest pending_review submission as approved
    const { data: subs } = await admin
      .from('content_submissions')
      .select('id')
      .eq('contract_id', contractId)
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: false })
      .limit(1)

    if (subs && subs.length > 0) {
      await admin
        .from('content_submissions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', subs[0].id)
    }

    // Insert in-app notification for the creator
    const contract = contracts.find(c => c.id === contractId)
    const influencerUserId = (contract?.influencer_profiles as any)?.user_id
    if (influencerUserId) {
      const payout = `₹${Math.round(Number(contract?.agreed_price_inr ?? 0) * 0.9).toLocaleString('en-IN')}`
      await admin.from('notifications').insert({
        user_id: influencerUserId,
        type: 'auto_approved',
        message: `Content auto-approved — ${payout} payment released from escrow`,
        read: false,
      })
    }

    processed++
  }

  console.log(`[cron/auto-approve] processed=${processed} failed=${failed}`)
  return NextResponse.json({ processed, failed })
}
