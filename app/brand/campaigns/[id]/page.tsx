import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { ApplicationsList, type Application } from './applications-list'

type CampaignDetail = {
  id: string
  brand_id: string
  title: string
  description: string | null
  required_format: string[] | null
  target_platforms: string[] | null
  target_niche: string[] | null
  target_tier: string[] | null
  budget_inr: number | null
  deadline: string | null
  status: string | null
  created_at: string | null
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

export default async function BrandCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!brand) redirect('/onboarding/brand')

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select(
      'id, brand_id, title, description, required_format, target_platforms, target_niche, target_tier, budget_inr, deadline, status, created_at',
    )
    .eq('id', id)
    .single<CampaignDetail>()

  if (campaignError || !campaign) {
    notFound()
  }

  // Authorization: brand can only view their own campaigns
  if (campaign.brand_id !== brand.id) {
    notFound()
  }

  const { data: applications, error: applicationsError } = await supabase
    .from('applications')
    .select(
      'id, campaign_id, influencer_id, status, cover_note, proposed_price_inr, applied_at, influencer_profiles(id, display_name, city, niche, bio)',
    )
    .eq('campaign_id', id)
    .order('applied_at', { ascending: false })
    .returns<Application[]>()

  const status = campaign.status ?? 'draft'
  const variant = STATUS_VARIANT[status] ?? 'outline'

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3">
          <Link href="/brand/campaigns">← Back to campaigns</Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground mt-1">
              Posted {formatDate(campaign.created_at)}
            </p>
          </div>
          <Badge variant={variant} className="capitalize">
            {status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="px-8 py-6 max-w-5xl flex flex-col gap-6">
        {/* Campaign details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brief</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {campaign.description && (
              <p className="text-sm whitespace-pre-wrap">
                {campaign.description}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-semibold">{formatINR(campaign.budget_inr)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="font-semibold">{formatDate(campaign.deadline)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t">
              <Tags label="Required format" values={campaign.required_format} />
              <Tags label="Target platforms" values={campaign.target_platforms} />
              <Tags label="Target niche" values={campaign.target_niche} />
              <Tags label="Target tier" values={campaign.target_tier} />
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Applications</h2>
              <p className="text-sm text-muted-foreground">
                {applications?.length ?? 0} influencer
                {(applications?.length ?? 0) === 1 ? '' : 's'} have applied to
                this brief.
              </p>
            </div>
          </div>

          {applicationsError ? (
            <Card className="border-destructive/50">
              <CardContent className="py-6">
                <p className="text-sm text-destructive">
                  Could not load applications: {applicationsError.message}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ApplicationsList
              initialApplications={applications ?? []}
              campaignId={campaign.id}
              brandId={brand.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Tags({
  label,
  values,
}: {
  label: string
  values: string[] | null
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {(values ?? []).length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          (values ?? []).map((v) => (
            <Badge key={v} variant="secondary" className="text-xs capitalize">
              {v.replace('_', ' ')}
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

export function generateMetadata() {
  return { title: 'Campaign · Brand' }
}
