import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Crayon <notifications@crayon.in>'

export async function POST(req: NextRequest) {
  const { contractId } = await req.json()
  if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: contract } = await admin
    .from('contracts')
    .select(`
      id, agreed_price_inr, brief_product,
      brand_profiles ( company_name ),
      content_packages ( format, platform, delivery_days ),
      influencer_profiles ( display_name, user_id )
    `)
    .eq('id', contractId)
    .single()

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  // Get creator's email from auth
  const { data: authUser } = await admin.auth.admin.getUserById(
    (contract.influencer_profiles as any)?.user_id
  )
  const creatorEmail = authUser?.user?.email
  if (!creatorEmail) return NextResponse.json({ error: 'Creator email not found' }, { status: 404 })

  const brandName = (contract.brand_profiles as any)?.company_name || 'A brand'
  const creatorName = (contract.influencer_profiles as any)?.display_name || 'Creator'
  const format = (contract.content_packages as any)?.format || 'content'
  const platform = (contract.content_packages as any)?.platform || ''
  const deliveryDays = (contract.content_packages as any)?.delivery_days || '—'
  const price = `₹${Number(contract.agreed_price_inr).toLocaleString('en-IN')}`
  const payout = `₹${Math.round(Number(contract.agreed_price_inr) * 0.9).toLocaleString('en-IN')}`
  const product = (contract.brief_product as string) || '(not specified)'
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/influencer/orders/${contractId}`

  const { error } = await resend.emails.send({
    from: FROM,
    to: creatorEmail,
    subject: `${brandName} wants to hire you on Crayon`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EDEFEB;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDEFEB;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#163300;padding:32px 40px;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#9FE870;letter-spacing:-0.5px;">Crayon</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#6A6C6A;text-transform:uppercase;letter-spacing:1px;">New hire request</p>
            <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#121511;line-height:1.2;">
              ${brandName} wants to hire you
            </h1>

            <!-- Details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDEFEB;border-radius:16px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${[
                      ['Product', product],
                      ['Content', `${format} on ${platform}`],
                      ['Delivery', `${deliveryDays} days`],
                      ['Package price', price],
                      ['Your payout', payout],
                    ].map(([label, value]) => `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6A6C6A;width:40%;">${label}</td>
                      <td style="padding:6px 0;font-size:13px;font-weight:700;color:#121511;">${value}</td>
                    </tr>`).join('')}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:14px;color:#6A6C6A;line-height:1.6;">
              You have <strong style="color:#121511;">48 hours</strong> to accept or decline. If you don't respond, the order will expire and funds will be returned to the brand.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${orderUrl}" style="display:inline-block;background:#9FE870;color:#163300;font-size:15px;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:12px;">
                    View & Accept Order →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #E8E8E8;">
            <p style="margin:0;font-size:12px;color:#B0B2AF;line-height:1.6;">
              You're receiving this because a brand hired you on Crayon. Questions? Reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })

  if (error) {
    console.error('[notify/hire] Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Insert in-app notification for the creator
  await admin.from('notifications').insert({
    user_id: (contract.influencer_profiles as any)?.user_id,
    type: 'offer_received',
    message: `${brandName} wants to hire you — ₹${Math.round(Number(contract.agreed_price_inr) * 0.9).toLocaleString('en-IN')} payout`,
    read: false,
  }).then(({ error: nErr }) => {
    if (nErr) console.error('[notify/hire] notification insert error:', nErr)
  })

  return NextResponse.json({ ok: true })
}
