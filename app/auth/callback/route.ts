import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ''

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!userData?.role) {
        // New user via signup with role param — use admin client to bypass RLS and create users row
        const admin = createAdminClient()
        if (next === 'brand' || next === 'creator') {
          const roleVal = next === 'brand' ? 'brand' : 'influencer'
          // UPDATE existing row — trigger already created it with null role
          const { data: updated } = await admin.from('users').update({ role: roleVal }).eq('id', data.user.id).select('id')
          // No row yet (trigger hasn't fired?) — INSERT it
          if (!updated || updated.length === 0) {
            await admin.from('users').insert({ id: data.user.id, role: roleVal })
          }
          return NextResponse.redirect(`${origin}/onboarding/${next}`)
        }
        // No role set and no signup context — ask them to choose their role
        return NextResponse.redirect(`${origin}/login?step=choose-role`)
      }

      if (userData.role === 'brand') return NextResponse.redirect(`${origin}/brand/dashboard`)
      if (userData.role === 'creator' || userData.role === 'influencer') {
        const { data: profile } = await supabase.from('creator_profiles').select('id').eq('user_id', data.user.id).maybeSingle()
        if (!profile) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=no_profile`)
        }
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
