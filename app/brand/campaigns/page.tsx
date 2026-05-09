import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type CampaignRow = {
  id: string
  title: string
  status: string | null
  budget_inr: number | null
  deadline: string | null
  created_at: string | null
  target_niche: string[] | null
  applications: { count: number }[] | null
}

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  open: 'default',
  draft: 'secondary',
  in_progress: 'outline',
  completed: 'secondary',
  cancelled: 'destructive',
}

function formatINR(n: number | null) {
  if (n == null) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export default async function BrandCampaignsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding/brand')
  }

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(
      'id, title, status, budget_inr, deadline, created_at, target_niche, applications(count)',
    )
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })
    .returns<CampaignRow[]>()

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Track briefs you&rsquo;ve posted and review incoming applications.
          </p>
        </div>
        <Button asChild>
          <Link href="/brand/campaigns/new">+ New campaign</Link>
        </Button>
      </div>

      <div className="px-8 py-6 max-w-5xl">
        {error ? (
          <Card className="border-destructive/50">
            <CardContent className="py-6">
              <p className="text-sm text-destructive">
                Could not load campaigns: {error.message}
              </p>
            </CardContent>
          </Card>
        ) : !campaigns || campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div>
                <p className="font-medium">No campaigns yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Post your first campaign to start receiving applications.
                </p>
              </div>
              <Button asChild>
                <Link href="/brand/campaigns/new">Post a campaign</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((c) => {
              const applicationCount = c.applications?.[0]?.count ?? 0
              const status = c.status ?? 'draft'
              const variant = STATUS_VARIANT[status] ?? 'outline'

              return (
                <Link
                  key={c.id}
                  href={`/brand/campaigns/${c.id}`}
                  className="block"
                >
                  <Card className="hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{c.title}</CardTitle>
                          <CardDescription>
                            Posted {formatDate(c.created_at)}
                          </CardDescription>
                        </div>
                        <Badge variant={variant} className="capitalize">
                          {status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(c.target_niche ?? []).slice(0, 4).map((n) => (
                          <Badge
                            key={n}
                            variant="secondary"
                            className="text-xs"
                          >
                            {n}
                          </Badge>
                        ))}
                        {(c.target_niche?.length ?? 0) > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(c.target_niche?.length ?? 0) - 4}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Budget</p>
                          <p className="font-medium">{formatINR(c.budget_inr)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Deadline</p>
                          <p className="font-medium">{formatDate(c.deadline)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Applications
                          </p>
                          <p className="font-medium">{applicationCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
