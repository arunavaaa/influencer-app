import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, contractId } = await req.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !contractId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify the HMAC signature Razorpay sends back
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify contract belongs to this brand user
  const { data: contract } = await admin
    .from('contracts')
    .select('id, escrow_status, brand_profiles!inner(user_id)')
    .eq('id', contractId)
    .single()

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  const brandUserId = (contract.brand_profiles as any)?.user_id
  if (brandUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (contract.escrow_status === 'held') {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  // Mark escrow as held — funds are now locked
  const { error } = await admin
    .from('contracts')
    .update({
      escrow_status: 'held',
      razorpay_order_id: razorpay_order_id,
    })
    .eq('id', contractId)

  if (error) {
    console.error('[payment/verify] DB update failed:', error)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  // Notify creator by email (fire-and-forget)
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notify/hire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractId }),
  }).catch(() => {/* non-blocking */})

  return NextResponse.json({ ok: true })
}
