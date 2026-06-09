import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { role } = await request.json()
  // 'creator' is not a valid enum value — the DB uses 'influencer' for creators
  const dbRole = role === 'creator' ? 'influencer' : role
  if (dbRole !== 'brand' && dbRole !== 'influencer') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const admin = createAdminClient()

  // UPDATE existing row (may have been created by auth trigger with null role)
  const { data: updated, error: updateError } = await admin
    .from('users')
    .update({ role: dbRole })
    .eq('id', user.id)
    .select('id')

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // No row existed — INSERT it
  if (!updated || updated.length === 0) {
    const { error: insertError } = await admin.from('users').insert({ id: user.id, role: dbRole })
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
