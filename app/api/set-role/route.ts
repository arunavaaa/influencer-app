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
  const { error } = await admin.from('users').upsert({ id: user.id, role })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
