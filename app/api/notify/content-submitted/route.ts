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
      id, agreed_price_inr,
      brand_profiles ( company_name, user_id ),
      influencer_profiles ( display_name ),
      content_packages ( format, platform )
    `)
    .eq('id', contractId)
    .single()

  if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

  // Get brand's email from auth
  const { data: authUser } = await admin.auth.admin.getUserById(
    (contract.brand_profiles as any)?.user_id
  )
  const brandEmail = authUser?.user?.email
  if (!brandEmail) return NextResponse.json({ error: 'Brand email not found' }, { status: 404 })

  const brandName = (contract.brand_profiles as any)?.company_name || 'Brand'
  const creatorName = (contract.influencer_profiles as any)?.display_name || 'The creator'
  const format = (contract.content_packages as any)?.format || 'content'
  const platform = (contract.content_packages as any)?.platform || ''
  const orderUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/brand/orders/${contractId}`

  const { error } = await resend.emails.send({
    from: FROM,
    to: brandEmail,
    subject: `${creatorName} submitted content for your review`,
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
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#6A6C6A;text-transform:uppercase;letter-spacing:1px;">Content ready for review</p>
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#121511;line-height:1.2;">
              ${creatorName} submitted their ${format}
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6A6C6A;line-height:1.6;">
              Your ${format} for ${platform} is ready. Review it and approve or request a revision.
            </p>

            <!-- Warning box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF9EC;border:1px solid #F5E27A;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#856404;line-height:1.5;">
                    <strong>72-hour auto-approval:</strong> If you don't approve or request a revision within 72 hours, the content will be automatically approved and payment will be released to the creator.
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td>
                  <a href="${orderUrl}" style="display:inline-block;background:#9FE870;color:#163300;font-size:15px;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:12px;">
                    Review Content →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#B0B2AF;">
              You can approve or request up to ${(contract.content_packages as any)?.revisions || 1} revision(s).
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #E8E8E8;">
            <p style="margin:0;font-size:12px;color:#B0B2AF;line-height:1.6;">
              You're receiving this because a creator submitted content for your Crayon order. Questions? Reply to this email.
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
    console.error('[notify/content-submitted] Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Insert in-app notification for the brand
  await admin.from('notifications').insert({
    user_id: (contract.brand_profiles as any)?.user_id,
    type: 'content_submitted',
    message: `${creatorName} submitted their ${format} — review and approve within 72 hours`,
    read: false,
  }).then(({ error: nErr }) => {
    if (nErr) console.error('[notify/content-submitted] notification insert error:', nErr)
  })

  return NextResponse.json({ ok: true })
}
