'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const NICHES = [
  'Fashion',
  'Food',
  'Tech',
  'Finance',
  'Fitness',
  'Travel',
  'Beauty',
  'Gaming',
  'Parenting',
  'Education',
  'Lifestyle',
  'Comedy',
] as const

const FORMATS: { value: string; label: string }[] = [
  { value: 'reel', label: 'Reel' },
  { value: 'post', label: 'Post' },
  { value: 'story', label: 'Story' },
  { value: 'ugc', label: 'UGC' },
]

const PLATFORMS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
]

const TIERS: { value: string; label: string; hint: string }[] = [
  { value: 'nano', label: 'Nano', hint: '1K–10K' },
  { value: 'micro', label: 'Micro', hint: '10K–100K' },
  { value: 'macro', label: 'Macro', hint: '100K–1M' },
  { value: 'mega', label: 'Mega', hint: '1M+' },
]

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(4, 'Title must be at least 4 characters')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  required_format: z
    .array(z.string())
    .min(1, 'Pick at least one content format'),
  target_platforms: z
    .array(z.string())
    .min(1, 'Pick at least one platform'),
  target_niche: z
    .array(z.string())
    .min(1, 'Pick at least one niche'),
  target_tier: z
    .array(z.string())
    .min(1, 'Pick at least one influencer tier'),
  budget_inr: z
    .number({ message: 'Enter a budget in INR' })
    .int('Budget must be a whole number')
    .positive('Budget must be greater than zero')
    .max(100000000, 'Budget seems too large'),
  deadline: z
    .string()
    .min(1, 'Pick a deadline')
    .refine((d) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(d) >= today
    }, 'Deadline cannot be in the past'),
})

type FormValues = z.infer<typeof schema>

export default function NewCampaignPage() {
  const supabase = createClient()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [planChecked, setPlanChecked] = useState(false)

  const todayIso = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function checkPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single()

      if (!brand || brand.subscription_tier === 'free') {
        router.replace('/brand/campaigns')
        return
      }
      setPlanChecked(true)
    }
    checkPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      required_format: [],
      target_platforms: [],
      target_niche: [],
      target_tier: [],
      budget_inr: undefined as unknown as number,
      deadline: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('You must be logged in to post a campaign.')
        router.push('/login')
        return
      }

      const { data: brand, error: brandError } = await supabase
        .from('brand_profiles')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .single()

      if (brandError || !brand) {
        toast.error(
          'We could not find your brand profile. Please complete brand onboarding first.',
        )
        router.push('/onboarding/brand')
        return
      }

      if (brand.subscription_tier === 'free') {
        toast.error('Campaigns are available on Pro and Scale plans.')
        router.push('/brand/campaigns')
        return
      }

      const { error: insertError } = await supabase.from('campaigns').insert({
        brand_id: brand.id,
        title: values.title,
        description: values.description,
        required_format: values.required_format,
        target_platforms: values.target_platforms,
        target_niche: values.target_niche,
        target_tier: values.target_tier,
        budget_inr: values.budget_inr,
        deadline: values.deadline,
        status: 'open',
      })

      if (insertError) {
        console.error(insertError)
        toast.error(insertError.message || 'Could not save campaign.')
        return
      }

      toast.success('Campaign posted — influencers can now apply.')
      router.push('/brand/campaigns')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!planChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-6">
        <h1 className="text-2xl font-bold">Post a campaign</h1>
        <p className="text-muted-foreground mt-1">
          Tell us what you need and which creators you&rsquo;re looking for.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="px-8 py-6 max-w-3xl flex flex-col gap-6"
      >
        {/* Brief */}
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
            <CardDescription>
              A clear title and a thorough description help influencers self-select.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Campaign title</Label>
              <Input
                id="title"
                placeholder="e.g. Summer skincare reel partnership"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="What is the product? What story should creators tell? Mandatory talking points, hashtags, dos and don'ts..."
                aria-invalid={!!errors.description}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
            <CardDescription>
              What content do you need and where should it run?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Controller
              control={control}
              name="required_format"
              render={({ field }) => (
                <MultiBadgeField
                  label="Required format"
                  options={FORMATS}
                  selected={field.value}
                  onToggle={(v) => field.onChange(toggle(field.value, v))}
                  error={errors.required_format?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="target_platforms"
              render={({ field }) => (
                <MultiBadgeField
                  label="Target platforms"
                  options={PLATFORMS}
                  selected={field.value}
                  onToggle={(v) => field.onChange(toggle(field.value, v))}
                  error={errors.target_platforms?.message}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Audience */}
        <Card>
          <CardHeader>
            <CardTitle>Audience</CardTitle>
            <CardDescription>
              We&rsquo;ll surface this campaign to influencers that match.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Controller
              control={control}
              name="target_niche"
              render={({ field }) => (
                <MultiBadgeField
                  label="Target niche"
                  options={NICHES.map((n) => ({ value: n, label: n }))}
                  selected={field.value}
                  onToggle={(v) => field.onChange(toggle(field.value, v))}
                  error={errors.target_niche?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="target_tier"
              render={({ field }) => (
                <MultiBadgeField
                  label="Target tier (followers)"
                  options={TIERS.map((t) => ({
                    value: t.value,
                    label: `${t.label} · ${t.hint}`,
                  }))}
                  selected={field.value}
                  onToggle={(v) => field.onChange(toggle(field.value, v))}
                  error={errors.target_tier?.message}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Budget + deadline */}
        <Card>
          <CardHeader>
            <CardTitle>Budget &amp; deadline</CardTitle>
            <CardDescription>
              All amounts in INR. Funds are held in escrow until content is approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget_inr">Budget (₹)</Label>
              <Input
                id="budget_inr"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="e.g. 50000"
                aria-invalid={!!errors.budget_inr}
                {...register('budget_inr', { valueAsNumber: true })}
              />
              {errors.budget_inr && (
                <p className="text-xs text-destructive">
                  {errors.budget_inr.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                min={todayIso}
                aria-invalid={!!errors.deadline}
                {...register('deadline')}
              />
              {errors.deadline && (
                <p className="text-xs text-destructive">
                  {errors.deadline.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post campaign'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function toggle(arr: string[], value: string) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

type Option = { value: string; label: string }

function MultiBadgeField({
  label,
  options,
  selected,
  onToggle,
  error,
}: {
  label: string
  options: Option[]
  selected: string[]
  onToggle: (value: string) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <Badge
              key={opt.value}
              variant={active ? 'default' : 'outline'}
              className="cursor-pointer text-sm py-1.5 px-3 select-none"
              onClick={() => onToggle(opt.value)}
              role="checkbox"
              aria-checked={active}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggle(opt.value)
                }
              }}
            >
              {opt.label}
            </Badge>
          )
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
