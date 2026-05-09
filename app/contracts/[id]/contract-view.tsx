'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { approveSubmission, requestRevision } from './actions'

export type Submission = {
  id: string
  contract_id: string
  file_url: string | null
  submitted_at: string | null
  auto_approve_at: string | null
  status: string
  brand_feedback: string | null
  revision_number: number | null
}

export type Transaction = {
  id: string
  contract_id: string
  type: string
  amount_inr: number
  status: string
  created_at: string | null
}

const SUBMISSION_BUCKET = 'content-submissions'

const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  submitted: 'outline',
  approved: 'default',
  auto_approved: 'default',
  revision_requested: 'destructive',
}

function formatINR(n: number | null | undefined) {
  if (n == null) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function formatDateTime(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return d
  }
}

function formatDuration(target: string | null) {
  if (!target) return null
  const ms = new Date(target).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  if (ms <= 0) return 'auto-approval pending…'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  if (hours > 24) return `auto-approves in ${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'}`
  if (hours > 0) return `auto-approves in ${hours}h ${minutes}m`
  return `auto-approves in ${minutes}m`
}

export function ContractView({
  contractId,
  contractStatus,
  agreedPriceInr,
  nonCircumventionExpiry,
  role,
  currentUserId,
  influencerProfileId,
  submissions: initialSubmissions,
  transactions,
}: {
  contractId: string
  contractStatus: string
  agreedPriceInr: number
  nonCircumventionExpiry: string | null
  role: 'brand' | 'influencer'
  currentUserId: string
  influencerProfileId: string | null
  submissions: Submission[]
  transactions: Transaction[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [revisionDraftId, setRevisionDraftId] = useState<string | null>(null)
  const [revisionFeedback, setRevisionFeedback] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submissions = initialSubmissions
  const completed =
    contractStatus === 'completed' || transactions.length > 0
  const hasOpenSubmission = submissions.some((s) => s.status === 'submitted')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!influencerProfileId) {
      toast.error('Could not find your influencer profile.')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large (100 MB max).')
      return
    }

    setUploading(true)
    try {
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_')
      const path = `${contractId}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        toast.error(uploadError.message || 'Upload failed.')
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(SUBMISSION_BUCKET).getPublicUrl(path)

      const autoApproveAt = new Date()
      autoApproveAt.setHours(autoApproveAt.getHours() + 72)

      const previousRevisions = submissions.length
      const { error: insertError } = await supabase
        .from('content_submissions')
        .insert({
          contract_id: contractId,
          file_url: publicUrl,
          status: 'submitted',
          auto_approve_at: autoApproveAt.toISOString(),
          revision_number: previousRevisions + 1,
        })

      if (insertError) {
        console.error(insertError)
        toast.error(insertError.message || 'Could not record submission.')
        return
      }

      toast.success('Content submitted — the brand has 72 hours to review.')
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  function handleApprove(submissionId: string) {
    if (isPending) return
    startTransition(async () => {
      const result = await approveSubmission(submissionId)
      if (!result.ok) {
        toast.error(result.error || 'Could not approve submission.')
        return
      }
      toast.success('Submission approved — payment released to influencer.')
      router.refresh()
    })
  }

  function handleRevision(submissionId: string) {
    if (isPending) return
    if (revisionFeedback.trim().length < 5) {
      toast.error('Please provide feedback (min 5 characters).')
      return
    }
    startTransition(async () => {
      const result = await requestRevision(submissionId, revisionFeedback)
      if (!result.ok) {
        toast.error(result.error || 'Could not request revision.')
        return
      }
      toast.success('Revision requested — the influencer can resubmit.')
      setRevisionDraftId(null)
      setRevisionFeedback('')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Contract summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contract</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Agreed price</p>
            <p className="font-semibold">{formatINR(agreedPriceInr)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-semibold capitalize">{contractStatus}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Non-circumvention until
            </p>
            <p className="font-semibold">
              {nonCircumventionExpiry
                ? new Date(nonCircumventionExpiry).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Completed banner with payment breakdown */}
      {completed && transactions.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Payment</CardTitle>
            <CardDescription>
              Contract complete. Payout split below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {t.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-muted-foreground capitalize">
                    {t.status}
                  </span>
                </div>
                <span className="font-semibold">{formatINR(t.amount_inr)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Influencer upload */}
      {role === 'influencer' && !completed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit content</CardTitle>
            <CardDescription>
              Upload a video or image. The brand has 72 hours to review or
              the submission auto-approves.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || hasOpenSubmission}
            >
              {uploading
                ? 'Uploading…'
                : hasOpenSubmission
                  ? 'Awaiting brand review'
                  : submissions.length > 0
                    ? 'Upload revision'
                    : 'Upload content'}
            </Button>
            {hasOpenSubmission && (
              <p className="text-xs text-muted-foreground mt-2">
                Wait for the brand to approve or request a revision before
                uploading again.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submissions list */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Submissions</h2>
            <p className="text-sm text-muted-foreground">
              {submissions.length === 0
                ? 'No content submitted yet.'
                : `${submissions.length} submission${submissions.length === 1 ? '' : 's'} so far.`}
            </p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {role === 'influencer'
                  ? 'Once you upload, your submission will appear here.'
                  : 'No submissions yet — the influencer will upload content here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((s) => {
              const variant = STATUS_VARIANT[s.status] ?? 'outline'
              const showActions =
                role === 'brand' && s.status === 'submitted'
              const isOpenForReview = s.status === 'submitted'
              const countdown = isOpenForReview
                ? formatDuration(s.auto_approve_at)
                : null

              return (
                <Card key={s.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          Revision #{s.revision_number ?? 1}
                        </CardTitle>
                        <CardDescription>
                          Submitted {formatDateTime(s.submitted_at)}
                          {countdown ? ` · ${countdown}` : ''}
                        </CardDescription>
                      </div>
                      <Badge variant={variant} className="capitalize">
                        {s.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {s.file_url ? (
                      <a
                        href={s.file_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-primary underline underline-offset-2 break-all"
                      >
                        Open file ↗
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No file attached.
                      </p>
                    )}

                    {s.brand_feedback && (
                      <div className="rounded-md border bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Brand feedback
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {s.brand_feedback}
                        </p>
                      </div>
                    )}

                    {showActions && (
                      <div className="flex flex-col gap-3 pt-2 border-t">
                        {revisionDraftId === s.id ? (
                          <>
                            <Textarea
                              rows={3}
                              placeholder="What needs to change? Be specific so the influencer can fix it in one go."
                              value={revisionFeedback}
                              onChange={(e) =>
                                setRevisionFeedback(e.target.value)
                              }
                              disabled={isPending}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRevisionDraftId(null)
                                  setRevisionFeedback('')
                                }}
                                disabled={isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleRevision(s.id)}
                                disabled={isPending}
                              >
                                {isPending ? 'Sending…' : 'Send revision request'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRevisionDraftId(s.id)
                                setRevisionFeedback('')
                              }}
                              disabled={isPending}
                            >
                              Request revision
                            </Button>
                            <Button
                              onClick={() => handleApprove(s.id)}
                              disabled={isPending}
                            >
                              {isPending ? 'Working…' : 'Approve'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      {/* Suppress unused warning while keeping the prop API stable for future
          per-user features (e.g. read receipts). */}
      <span hidden data-current-user-id={currentUserId} />
    </div>
  )
}
