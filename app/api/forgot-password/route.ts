import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const admin = createAdminClient()

  const { data, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })

  const exists = data.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!exists) {
    return NextResponse.json(
      { error: 'No account found with this email address.' },
      { status: 404 }
    )
  }

  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
