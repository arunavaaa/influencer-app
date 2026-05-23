import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user already has a role set
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // If no role yet — check for a next param (set by onboarding Google OAuth)
      const next = searchParams.get('next')
      if (!userData?.role) {
        return NextResponse.redirect(`${origin}${next || '/onboarding/creator'}`)
      }

      // Role conflict: brand account trying to join as creator
      if (userData.role === 'brand' && next === '/onboarding/creator') {
        return NextResponse.redirect(`${origin}/onboarding/creator?error=brand_account`)
      }

      // Role conflict: creator account trying to join as brand
      if (userData.role === 'influencer' && next === '/onboarding/brand') {
        return NextResponse.redirect(`${origin}/onboarding/brand?error=creator_account`)
      }

      // If influencer, go to influencer dashboard
      if (userData.role === 'influencer') {
        return NextResponse.redirect(`${origin}/influencer/home`)
      }

      // If brand, go to brand dashboard
      if (userData.role === 'brand') {
        return NextResponse.redirect(`${origin}/brand/home`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}