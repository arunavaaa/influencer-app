import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { SignOutButton } from './sign-out-button'

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public navbar — visitor not signed in
  if (!user) {
    return (
      <nav className="border-b bg-background sticky top-0 z-40">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="font-semibold tracking-tight">
            Crayon Marketplace
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </nav>
    )
  }

  // Determine which profiles exist for this user. We accept both being true
  // simultaneously (dual-role testing) and surface both navs in that case.
  const [brandRes, influencerRes] = await Promise.all([
    supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const isBrand = !!brandRes.data
  const isInfluencer = !!influencerRes.data
  const dualRole = isBrand && isInfluencer

  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="font-semibold tracking-tight pr-3 mr-1 border-r"
          >
            Crayon
          </Link>

          {isBrand && (
            <>
              <NavLink href="/brand/discover">Discover</NavLink>
              <NavLink href="/brand/campaigns">My Campaigns</NavLink>
              <NavLink href="/brand/campaigns/new">Post Campaign</NavLink>
            </>
          )}

          {isInfluencer && (
            <>
              {dualRole && <Separator />}
              <NavLink href="/influencer/home">Dashboard</NavLink>
              <NavLink href="/influencer/campaigns">Campaigns</NavLink>
            </>
          )}

          {!isBrand && !isInfluencer && (
            <NavLink href="/onboarding/select-role">Finish setup</NavLink>
          )}
        </div>

        <div className="flex items-center gap-2">
          {dualRole && (
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              brand · influencer
            </Badge>
          )}
          <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[180px]">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </div>
    </nav>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Button asChild variant="ghost" size="sm" className="font-normal">
      <Link href={href}>{children}</Link>
    </Button>
  )
}

function Separator() {
  return (
    <span aria-hidden className="mx-1 h-5 w-px bg-border" />
  )
}
