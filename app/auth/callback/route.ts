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
        // New user — send to onboarding based on next param
        if (next === 'brand') return NextResponse.redirect(`${origin}/onboarding/brand`)
        return NextResponse.redirect(`${origin}/onboarding/creator`)
      }

      if (userData.role === 'brand') return NextResponse.redirect(`${origin}/brand/dashboard`)
      if (userData.role === 'creator') return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
