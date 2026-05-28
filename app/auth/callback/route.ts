import { createClient } from '@/lib/supabase/server'
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
        // New user via signup with role param — send straight to onboarding
        if (next === 'brand') return NextResponse.redirect(`${origin}/onboarding/brand`)
        if (next === 'creator') return NextResponse.redirect(`${origin}/onboarding/creator`)
        // Existing auth account but no users row — block and show error
        if (!next) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=no_profile`)
        }
        // New user via login page Google button — ask them to choose their role
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
