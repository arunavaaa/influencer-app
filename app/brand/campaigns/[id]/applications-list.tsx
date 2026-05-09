'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type Application = {
  id: string
  campaign_id: string
  influencer_id: string
  status: string
  cover_note: string | null
  proposed_price_inr: number | null
  applied_at: string | null
  influencer_profiles: {
    id: string
    display_name: string | null
    city: string | null
    niche: string[] | null
    bio: string | null
  } | null
  contracts: { id: string }[] | null
}

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  pending: 'outline',
  accepted: 'default',
  rejected: 'destructive',
  withdrawn: 'secondary',
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

function plus12MonthsIso() {
  const d = new Date()
  d.setMonth(d.getMonth() + 12)
  return d.toISOString().slice(0, 10)
}

export function ApplicationsList({
  initialApplications,
  campaignId,
  brandId,
}: {
  initialApplications: Application[]
  campaignId: string
  brandId: string
}) {
  const supabase = createClient()
  const [applications, setApplications] = useState(initialApplications)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleAccept(app: Application) {
    if (busyId) return
    setBusyId(app.id)
    try {
      // 1. Update the application status to 'accepted'
      const { error: appUpdateError } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', app.id)

      if (appUpdateError) {
        console.error(appUpdateError)
        toast.error(
          appUpdateError.message || 'Could not accept application.',
        )
        return
      }

      // 2. Insert the contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          application_id: app.id,
          campaign_id: campaignId,
          influencer_id: app.influencer_id,
          brand_id: brandId,
          agreed_price_inr: app.proposed_price_inr ?? 0,
          non_circumvention_expiry: plus12MonthsIso(),
          status: 'active',
        })
        .select('id')
        .single<{ id: string }>()

      if (contractError || !contract) {
        console.error(contractError)
        // Roll the application back to pending so the brand can retry
        await supabase
          .from('applications')
          .update({ status: 'pending' })
          .eq('id', app.id)
        toast.error(
          contractError?.message ||
            'Application accepted, but contract creation failed. Reverted.',
        )
        return
      }

      setApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: 'accepted', contracts: [{ id: contract.id }] }
            : a,
        ),
      )
      toast.success('Application accepted — contract created.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(app: Application) {
    if (busyId) return
    setBusyId(app.id)
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', app.id)

      if (error) {
        console.error(error)
        toast.error(error.message || 'Could not reject application.')
        return
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'rejected' } : a)),
      )
      toast.success('Application rejected.')
    } finally {
      setBusyId(null)
    }
  }

  if (applications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-medium">No applications yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Influencers who match your brief will be able to apply once they
            see this campaign.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((app) => {
        const inf = app.influencer_profiles
        const isPending = app.status === 'pending'
        const isBusy = busyId === app.id
        const variant = STATUS_VARIANT[app.status] ?? 'outline'

        return (
          <Card key={app.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-base font-semibold shrink-0">
                    {inf?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {inf?.display_name ?? 'Unknown influencer'}
                    </CardTitle>
                    <CardDescription>
                      {inf?.city || 'Location unknown'}
                      {' · '}Applied {formatDate(app.applied_at)}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={variant} className="capitalize">
                  {app.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {(inf?.niche ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(inf?.niche ?? []).slice(0, 6).map((n) => (
                    <Badge key={n} variant="secondary" className="text-xs">
                      {n}
                    </Badge>
                  ))}
                </div>
              )}

              {app.cover_note && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Cover note
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {app.cover_note}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Proposed price
                  </p>
                  <p className="font-semibold">
                    {formatINR(app.proposed_price_inr)}
                  </p>
                </div>
                {isPending ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(app)}
                      disabled={isBusy}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleAccept(app)}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Working…' : 'Accept'}
                    </Button>
                  </div>
                ) : app.status === 'accepted' ? (
                  app.contracts?.[0]?.id ? (
                    <Button asChild>
                      <Link href={`/messages/${app.contracts[0].id}`}>
                        Message
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Contract created
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground capitalize">
                    {app.status}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
