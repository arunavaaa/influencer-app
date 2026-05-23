import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contractId } = await req.json()
  if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 })

  const admin = createAdminClient()

  // Verify this contract belongs to this brand user
  const { data: contract } = await admin
    .from('contracts')
    .select('id, agreed_price_inr, escrow_status, brand_profiles!inner(user_id)')
    .eq('id', contractId)
    .single()

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  const brandUserId = (contract.brand_profiles as any)?.user_id
  if (brandUserId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (contract.escrow_status === 'held') {
    return NextResponse.json({ error: 'Already paid' }, { status: 409 })
  }

  // Razorpay expects amount in paise (1 INR = 100 paise)
  const platformFee = Math.round(contract.agreed_price_inr * 0.10)
  const totalInr = contract.agreed_price_inr + platformFee
  const amountPaise = totalInr * 100

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `contract_${contractId.slice(0, 16)}`,
    notes: { contractId },
  })

  // Save the razorpay order id on the contract
  await admin
    .from('contracts')
    .update({ razorpay_order_id: order.id })
    .eq('id', contractId)

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
  })
}
