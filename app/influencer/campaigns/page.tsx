'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CampaignCard = {
  id: string
  title: string
  description: string | null
  budget_inr: number | null
  deadline: string | null
  target_niche: string[] | null
  brand_profiles: {
    company_name: string | null
  } | null
}

const applySchema = z.object({
  cover_note: z
    .string()
    .trim()
    .min(20, 'Cover note must be at least 20 characters')
    .max(1000, 'Cover note must be 1000 characters or fewer'),
  proposed_price_inr: z
    .number({ message: 'Enter your proposed price' })
    .int('Price must be a whole number')
    .positive('Price must be greater than zero')
    .max(10000000, 'Price seems too large'),
})

type ApplyValues = z.infer<typeof applySchema>

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

export default function InfluencerCampaignsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [influencerId, setInfluencerId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([])
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [applyingTo, setApplyingTo] = useState<CampaignCard | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { cover_note: '', proposed_price_inr: undefined as unknown as number },
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('influencer_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) {
          router.push('/onboarding/influencer')
          return
        }

        if (cancelled) return
        setInfluencerId(profile.id)

        const [campaignsRes, applicationsRes] = await Promise.all([
          supabase
            .from('campaigns')
            .select(
              'id, title, description, budget_inr, deadline, target_niche, brand_profiles(company_name)',
            )
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .returns<CampaignCard[]>(),
          supabase
            .from('applications')
            .select('campaign_id')
            .eq('influencer_id', profile.id),
        ])

        if (cancelled) return

        if (campaignsRes.error) {
          console.error(campaignsRes.error)
          toast.error('Could not load campaigns.')
        } else {
          setCampaigns(campaignsRes.data ?? [])
        }

        if (applicationsRes.error) {
          console.error(applicationsRes.error)
        } else {
          setAppliedIds(
            new Set((applicationsRes.data ?? []).map((a) => a.campaign_id)),
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // We only want to run on mount; supabase + router are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openApply(campaign: CampaignCard) {
    reset({ cover_note: '', proposed_price_inr: undefined as unknown as number })
    setApplyingTo(campaign)
  }

  function closeApply(open: boolean) {
    if (!open) setApplyingTo(null)
  }

  async function onSubmitApply(values: ApplyValues) {
    if (!applyingTo || !influencerId) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('applications').insert({
        campaign_id: applyingTo.id,
        influencer_id: influencerId,
        status: 'pending',
        proposed_price_inr: values.proposed_price_inr,
        cover_note: values.cover_note,
      })

      if (error) {
        // Unique-constraint error if the user already applied (defensive)
        if (error.code === '23505') {
          toast.warning('You have already applied to this campaign.')
          setAppliedIds((prev) => new Set(prev).add(applyingTo.id))
          setApplyingTo(null)
          return
        }
        console.error(error)
        toast.error(error.message || 'Could not submit application.')
        return
      }

      setAppliedIds((prev) => new Set(prev).add(applyingTo.id))
      toast.success('Application submitted — the brand will see it.')
      setApplyingTo(null)
    } finally {
      setSubmitting(false)
    }
  }

  const visibleCampaigns = useMemo(() => campaigns, [campaigns])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-6">
        <h1 className="text-2xl font-bold">Open campaigns</h1>
        <p className="text-muted-foreground mt-1">
          Browse briefs from brands and apply to ones that match.
        </p>
      </div>

      <div className="px-8 py-6 max-w-6xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading campaigns…</p>
          </div>
        ) : visibleCampaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium">No open campaigns right now</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon — new briefs are posted regularly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCampaigns.map((c) => {
              const alreadyApplied = appliedIds.has(c.id)
              return (
                <Card
                  key={c.id}
                  className="flex flex-col hover:border-primary transition-colors"
                >
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{c.title}</CardTitle>
                    <CardDescription>
                      {c.brand_profiles?.company_name ?? 'A brand'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {c.description}
                      </p>
                    )}
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
                    <div className="flex items-center justify-between text-sm pt-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Budget</p>
                        <p className="font-medium">{formatINR(c.budget_inr)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Deadline</p>
                        <p className="font-medium">{formatDate(c.deadline)}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={alreadyApplied}
                      variant={alreadyApplied ? 'outline' : 'default'}
                      onClick={() => openApply(c)}
                    >
                      {alreadyApplied ? 'Applied' : 'Apply'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Apply dialog */}
      <Dialog open={!!applyingTo} onOpenChange={closeApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to campaign</DialogTitle>
            <DialogDescription>
              {applyingTo?.title}
              {applyingTo?.brand_profiles?.company_name
                ? ` · ${applyingTo.brand_profiles.company_name}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmitApply)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cover_note">Cover note</Label>
              <Textarea
                id="cover_note"
                rows={5}
                placeholder="Why are you a fit? Past relevant work, ideas for the brief, audience match..."
                aria-invalid={!!errors.cover_note}
                {...register('cover_note')}
              />
              {errors.cover_note && (
                <p className="text-xs text-destructive">
                  {errors.cover_note.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proposed_price_inr">Proposed price (₹)</Label>
              <Input
                id="proposed_price_inr"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="e.g. 12000"
                aria-invalid={!!errors.proposed_price_inr}
                {...register('proposed_price_inr', { valueAsNumber: true })}
              />
              {errors.proposed_price_inr && (
                <p className="text-xs text-destructive">
                  {errors.proposed_price_inr.message}
                </p>
              )}
              {applyingTo?.budget_inr != null && (
                <p className="text-xs text-muted-foreground">
                  Brand&rsquo;s posted budget: {formatINR(applyingTo.budget_inr)}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setApplyingTo(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
