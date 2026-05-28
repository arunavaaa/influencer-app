import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'arunavasadhu54@gmail.com'

const TYPE_LABEL: Record<string, string> = {
  bug:        '🐛 Bug Report',
  suggestion: '💡 Suggestion',
  confusing:  '😕 Something Confusing',
  general:    '💬 General Feedback',
  onboarding: '🎉 Onboarding Feedback',
}

export async function POST(req: NextRequest) {
  const { type = 'general', message, page_url } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Resolve user details
  let userName = 'Anonymous'
  let userEmail = 'unknown'
  let userRole = 'unknown'

  if (user) {
    userEmail = user.email ?? 'unknown'
    const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    userRole = userRow?.role ?? 'unknown'

    if (userRole === 'brand') {
      const { data: brand } = await supabase.from('brand_profiles').select('brand_name').eq('user_id', user.id).maybeSingle()
      userName = brand?.brand_name ?? userEmail
    } else {
      const { data: creator } = await supabase.from('creator_profiles').select('display_name').eq('user_id', user.id).maybeSingle()
      userName = creator?.display_name ?? userEmail
    }
  }

  // Save to feedback table (always)
  await supabase.from('feedback').insert({
    user_id:    user?.id ?? null,
    user_role:  userRole,
    user_name:  userName,
    user_email: userEmail,
    type,
    message:    message.trim(),
    page_url:   page_url ?? null,
  })

  // Send email (only if key is configured)
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && apiKey !== 'your_resend_key') {
    try {
      const resend = new Resend(apiKey)
      const fromAddr = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
      const label = TYPE_LABEL[type] ?? `📝 ${type}`
      const roleTag = userRole === 'brand' ? '🏢 Brand' : userRole === 'influencer' ? '🎥 Creator' : '❓ Unknown'
      const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

      await resend.emails.send({
        from: `GrabCollab Feedback <${fromAddr}>`,
        to:   [ADMIN_EMAIL],
        subject: `${label} — ${userName} (${userRole})`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background: #FAFAFA; border-radius: 16px;">
            <div style="background: #163300; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px;">
              <h2 style="color: #9FE870; margin: 0; font-size: 20px;">${label}</h2>
              <p style="color: #9FE870; opacity: 0.7; margin: 4px 0 0; font-size: 13px;">${istTime} IST</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #F0F0F0;">
                <td style="padding: 12px 16px; color: #6A6C6A; font-size: 13px; width: 100px;">From</td>
                <td style="padding: 12px 16px; font-weight: 700; font-size: 14px; color: #121511;">${userName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #F0F0F0;">
                <td style="padding: 12px 16px; color: #6A6C6A; font-size: 13px;">Email</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #121511;">${userEmail}</td>
              </tr>
              <tr style="border-bottom: 1px solid #F0F0F0;">
                <td style="padding: 12px 16px; color: #6A6C6A; font-size: 13px;">Role</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #121511;">${roleTag}</td>
              </tr>
              ${page_url ? `<tr><td style="padding: 12px 16px; color: #6A6C6A; font-size: 13px;">Page</td><td style="padding: 12px 16px; font-size: 13px; color: #4A4C4A; font-family: monospace;">${page_url}</td></tr>` : ''}
            </table>

            <div style="background: white; border-radius: 12px; padding: 20px 24px; border-left: 4px solid #163300;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #121511; white-space: pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
          </div>
        `,
      })
    } catch (_) {
      // Email failure is non-fatal — feedback is already saved to DB
    }
  }

  return NextResponse.json({ ok: true })
}
