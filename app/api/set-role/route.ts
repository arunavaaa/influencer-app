import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { role } = await request.json()
  if (role !== 'brand' && role !== 'creator') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Try UPDATE first (handles existing row, including rows created by auth triggers with null role)
  const { error: updateError, count } = await admin
    .from('users')
    .update({ role })
    .eq('id', user.id)
    .select('id', { count: 'exact', head: true })

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // If no row existed, INSERT it
  if ((count ?? 0) === 0) {
    const { error: insertError } = await admin.from('users').insert({ id: user.id, role })
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
