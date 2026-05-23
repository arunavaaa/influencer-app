'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, Clock, CheckCircle, XCircle,
  AlertCircle, Package, FileText, Calendar, Loader2,
  ExternalLink, Check, RotateCcw, BadgeCheck,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────── */
type OrderDetail = {
  id: string
  agreed_price_inr: number
  status: string
  escrow_status: string
  non_circumvention_expiry: string | null
  created_at: string
  hired_at: string | null
  accepted_at: string | null
  auto_approve_at: string | null
  brief_product: string | null
  brief_message: string | null
  brief_dos_donts: string | null
  brief_golive_date: string | null
  influencer_profiles: {
    id: string
    display_name: string
    profile_photo_url: string | null
    city: string | null
    niche: string[]
    ig_verified: boolean
  } | null
  content_packages: {
    format: string
    platform: string
    delivery_days: number
    revisions_allowed: number
  } | null
}

type Submission = {
  id: string
  submitted_at: string
  status: string
  file_url: string | null
  brand_feedback: string | null
  reviewed_at: string | null
}

/* ─── Helpers ────────────────────────────────────────────── */
function fmtPrice(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}


function useCountdown(target: string | null) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!target) return
    function calc() {
      const diff = new Date(target!).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Imminent'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      setTimeLeft(`${h}h ${m}m`)
    }
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [target])

  return timeLeft
}

const STATUS_STEPS = [
  { key: 'pending_acceptance', label: 'Hire sent' },
  { key: 'accepted', label: 'In progress' },
  { key: 'content_submitted', label: 'Review content' },
  { key: 'approved', label: 'Completed' },
]

function statusStepIndex(status: string) {
  if (['approved', 'auto_approved'].includes(status)) return 3
  if (status === 'content_submitted') return 2
  if (['accepted', 'revision_requested'].includes(status)) return 1
  return 0
}

const AVATAR_COLORS = [
  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
]

/* ─── Main Page ──────────────────────────────────────────── */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)

  const autoApproveCountdown = useCountdown(order?.auto_approve_at || null)

  const fetchOrder = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('contracts')
      .select(`
        id, agreed_price_inr, status, escrow_status,
        non_circumvention_expiry, created_at,
        hired_at, accepted_at, auto_approve_at,
        brief_product, brief_message, brief_dos_donts, brief_golive_date,
        influencer_profiles ( id, display_name, profile_photo_url, city, niche, ig_verified ),
        content_packages ( format, platform, delivery_days, revisions_allowed )
      `)
      .eq('id', id)
      .single()

    if (!data) { router.push('/brand/orders'); return }
    setOrder(data as unknown as OrderDetail)

    const { data: subs } = await supabase
      .from('content_submissions')
      .select('id, submitted_at, status, file_url, brand_feedback, reviewed_at')
      .eq('contract_id', id)
      .order('submitted_at', { ascending: true })

    const allSubs = (subs || []) as Submission[]
    setSubmissions(allSubs)
    setSubmission(allSubs[allSubs.length - 1] ?? null)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  async function handleApprove() {
    setActionLoading(true)
    try {
      await supabase.from('contracts').update({ status: 'approved', escrow_status: 'released' }).eq('id', id)
      if (submission) await supabase.from('content_submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', submission.id)
      toast.success('Content approved! Payment released to creator.')
      fetchOrder()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRequestRevision() {
    if (!revisionNote.trim()) { toast.error('Please describe what needs to change.'); return }
    setActionLoading(true)
    try {
      await supabase.from('contracts').update({ status: 'revision_requested' }).eq('id', id)
      if (submission) {
        await supabase.from('content_submissions').update({ status: 'revision_requested', brand_feedback: revisionNote.trim(), reviewed_at: new Date().toISOString() }).eq('id', submission.id)
      }
      toast.success('Revision request sent to creator.')
      setShowRevisionForm(false)
      setRevisionNote('')
      fetchOrder()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#163300]" />
      </div>
    )
  }

  if (!order) return null

  const creator = order.influencer_profiles
  const pkg = order.content_packages
  const stepIdx = statusStepIndex(order.status)
  const isDeclined = order.status === 'declined' || order.status === 'cancelled'
  const isCompleted = ['approved', 'auto_approved'].includes(order.status)
  const needsReview = order.status === 'content_submitted'
  const revisionsAllowed = pkg?.revisions_allowed ?? 2
  const revisionsUsed = submissions.filter(s => s.status === 'revision_requested').length
  const revisionsLeft = Math.max(0, revisionsAllowed - revisionsUsed)
  const colorIdx = (creator?.display_name || '').charCodeAt(0) % AVATAR_COLORS.length
  const av = AVATAR_COLORS[colorIdx]

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Back nav */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-4">
        <div className="max-w-[1360px] mx-auto">
          <Link
            href="/brand/orders"
            className="flex items-center gap-2 text-[14px] font-semibold text-[#6A6C6A] hover:text-[#121511] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        <div className="flex gap-8 items-start">

          {/* LEFT — Main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* ── WHAT TO DO NOW BANNER ── */}
            {order.status === 'pending_acceptance' && (
              <div className="bg-white rounded-[20px] p-6 border-2 border-[#E8E8E8]">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#6A6C6A] mb-2">Waiting</p>
                <p className="text-[20px] font-black text-[#121511] mb-1">Hire sent — waiting for {creator?.display_name} to accept</p>
                <p className="text-[14px] text-[#6A6C6A]">They have 48 hours to respond. You'll be notified immediately when they accept. If they don't respond, your payment is automatically refunded.</p>
              </div>
            )}

            {order.status === 'accepted' && (
              <div className="bg-[#9FE870] rounded-[20px] p-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#163300]/60 mb-2">In progress</p>
                <p className="text-[20px] font-black text-[#163300] mb-1">{creator?.display_name} is creating your content</p>
                <p className="text-[14px] text-[#163300]/70">
                  Nothing to do right now. You'll get notified the moment they submit content for your review.
                  {order.brief_golive_date && <span className="font-semibold"> Submission deadline: {fmtDate(order.brief_golive_date)}.</span>}
                </p>
              </div>
            )}

            {needsReview && (
              <div className="bg-[#163300] rounded-[20px] p-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9FE870] mb-2">Action required</p>
                <p className="text-[20px] font-black text-white mb-1">Content is ready — review it now</p>
                <p className="text-[14px] text-white/70 mb-3">
                  {creator?.display_name} has submitted their content. Watch it below and{' '}
                  {revisionsLeft > 0
                    ? 'either approve to release payment, or request a revision with specific feedback.'
                    : 'approve to release payment — all revisions have been used.'}
                  {order.auto_approve_at && <span className="font-bold text-[#9FE870]"> Auto-approves in {autoApproveCountdown}.</span>}
                </p>
                <div className="flex gap-2 flex-wrap text-[13px] font-bold text-white/50">
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span> Watch the content</span>
                  <span className="text-white/20">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span> {revisionsLeft > 0 ? 'Approve or request revision' : 'Approve'}</span>
                  <span className="text-white/20">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span> Payment releases to creator</span>
                </div>
              </div>
            )}

            {order.status === 'revision_requested' && (
              <div className="bg-orange-50 rounded-[20px] p-6 border border-orange-200">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 mb-2">Revision in progress</p>
                <p className="text-[20px] font-black text-orange-900 mb-1">Revision requested — creator is reworking the content</p>
                <p className="text-[14px] text-orange-700">You'll be notified when they resubmit. Nothing to do right now.</p>
              </div>
            )}

            {isCompleted && (
              <div className="bg-[#163300] rounded-[20px] p-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9FE870] mb-2">Complete</p>
                <p className="text-[20px] font-black text-white mb-1">Campaign delivered — payment released</p>
                <p className="text-[14px] text-white/60">Content approved and payment sent to {creator?.display_name}. Consider leaving a review.</p>
              </div>
            )}

            {/* Order header */}
            <div className="bg-white rounded-[20px] p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[18px] font-black overflow-hidden ${av.bg} ${av.text}`}>
                    {creator?.profile_photo_url
                      ? <img src={creator.profile_photo_url} alt="" className="w-full h-full object-cover" />
                      : (creator?.display_name?.[0] || '?').toUpperCase()
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[18px] font-black text-[#121511]">{creator?.display_name}</p>
                      {creator?.ig_verified && (
                        <BadgeCheck className="w-4 h-4 text-[#9FE870]" />
                      )}
                    </div>
                    <p className="text-[13px] text-[#6A6C6A]">
                      {[pkg?.format, pkg?.platform, order.hired_at ? `Hired ${fmtDate(order.hired_at)}` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/brand/creators/${creator?.id}`}
                  className="flex items-center gap-1.5 text-[13px] text-[#163300] font-semibold hover:underline"
                >
                  View profile <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Progress stepper */}
              {!isDeclined && (
                <div className="flex items-center gap-0 mb-1">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-all ${i <= stepIdx ? 'bg-[#163300] text-[#9FE870]' : 'bg-[#EDEFEB] text-[#B0B2AF]'}`}>
                          {i < stepIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <p className={`text-[11px] mt-1 font-semibold text-center leading-tight ${i <= stepIdx ? 'text-[#163300]' : 'text-[#B0B2AF]'}`}>
                          {step.label}
                        </p>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 -mt-5 transition-all ${i < stepIdx ? 'bg-[#163300]' : 'bg-[#EDEFEB]'}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isDeclined && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[10px]">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <p className="text-[13px] text-red-700 font-semibold">
                    {order.status === 'declined' ? 'Creator declined this hire. Your payment has been refunded.' : 'Order cancelled.'}
                  </p>
                </div>
              )}
            </div>


            {/* Content submission */}
            {submission && (
              <div className="bg-white rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-black text-[#121511]">Content Submitted</h2>
                  <span className="text-[12px] text-[#6A6C6A]">{fmtDate(submission.submitted_at)}</span>
                </div>

                {submission.file_url ? (
                  <div className="mb-4">
                    {/\.(mp4|mov|webm)/i.test(submission.file_url) ? (
                      <video
                        src={submission.file_url}
                        controls
                        className="w-full rounded-[14px] max-h-[400px] bg-black"
                      />
                    ) : (
                      <img
                        src={submission.file_url}
                        alt="Submitted content"
                        className="w-full rounded-[14px] max-h-[400px] object-contain bg-[#EDEFEB]"
                      />
                    )}
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-[#163300] font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open full size
                    </a>
                  </div>
                ) : (
                  <div className="bg-[#EDEFEB] rounded-[12px] p-8 text-center mb-4">
                    <FileText className="w-8 h-8 text-[#B0B2AF] mx-auto mb-2" />
                    <p className="text-[14px] text-[#6A6C6A]">Content file not attached — check with creator.</p>
                  </div>
                )}

                {submission.brand_feedback && (
                  <div className="p-3 bg-[#EDEFEB] rounded-[10px] mb-4">
                    <p className="text-[12px] font-bold text-[#6A6C6A] mb-1">Creator's note</p>
                    <p className="text-[14px] text-[#121511]">{submission.brand_feedback}</p>
                  </div>
                )}

                {/* Action buttons */}
                {needsReview && !showRevisionForm && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 py-3.5 rounded-[12px] bg-[#9FE870] text-[#163300] text-[15px] font-black hover:bg-[#8fd960] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve & release payment
                      </button>
                      {revisionsLeft > 0 && (
                        <button
                          onClick={() => setShowRevisionForm(true)}
                          className="px-5 py-3.5 rounded-[12px] border border-[#E8E8E8] text-[15px] font-semibold text-[#6A6C6A] hover:bg-[#EDEFEB] transition-colors flex items-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Request revision
                        </button>
                      )}
                    </div>
                    {revisionsLeft === 1 && (
                      <p className="text-[12px] text-orange-700">
                        ⚠ Last revision — once requested, you can only approve.
                      </p>
                    )}
                    {revisionsLeft === 0 && (
                      <p className="text-[12px] text-[#6A6C6A]">
                        All {revisionsAllowed} revisions used — you can only approve now.
                      </p>
                    )}
                  </div>
                )}

                {showRevisionForm && (
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-[#163300] uppercase tracking-wider">
                      What needs to change?
                    </label>
                    <textarea
                      rows={3}
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      placeholder="Be specific — e.g. 'Please re-shoot without the background music and show the product close-up at 0:10'"
                      className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] resize-none transition-colors"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowRevisionForm(false); setRevisionNote('') }}
                        className="px-5 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] font-semibold text-[#6A6C6A] hover:bg-[#EDEFEB] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRequestRevision}
                        disabled={actionLoading}
                        className="flex-1 py-3 rounded-[12px] bg-[#163300] text-white text-[14px] font-bold hover:bg-[#1e4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Send revision request
                      </button>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-[10px]">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-[13px] text-green-700 font-semibold">
                      {order.status === 'auto_approved' ? 'Auto-approved after 72h. ' : 'You approved this content. '}
                      Payment released to creator.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Previous submissions */}
            {submissions.length > 1 && (
              <div className="bg-white rounded-[20px] p-6">
                <h2 className="text-[15px] font-black text-[#121511] mb-4">Previous submissions</h2>
                <div className="flex flex-col gap-2">
                  {submissions.slice(0, -1).map((sub, i) => (
                    <div key={sub.id} className="flex items-start gap-3 p-3 rounded-[12px] bg-[#EDEFEB]">
                      <FileText className="w-4 h-4 text-[#6A6C6A] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-[#121511]">Submission {i + 1}</p>
                          <span className="text-[11px] text-[#B0B2AF]">{fmtDate(sub.submitted_at)}</span>
                          {sub.status === 'revision_requested' && (
                            <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Revision requested</span>
                          )}
                        </div>
                        {sub.brand_feedback && (
                          <p className="text-[12px] text-[#6A6C6A] mt-1">Your feedback: {sub.brand_feedback}</p>
                        )}
                      </div>
                      {sub.file_url && (
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] font-semibold text-[#163300] hover:underline flex-shrink-0"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brief recap */}
            <div className="bg-white rounded-[20px] p-6">
              <h2 className="text-[17px] font-black text-[#121511] mb-4">Your Brief</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Product / Service', value: order.brief_product },
                  { label: 'Submission deadline', value: fmtDate(order.brief_golive_date) },
                  { label: 'Key message', value: order.brief_message },
                  { label: 'Dos & don\'ts', value: order.brief_dos_donts || 'None specified' },
                ].map(f => (
                  <div key={f.label} className="bg-[#EDEFEB] rounded-[12px] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#6A6C6A] mb-1">{f.label}</p>
                    <p className="text-[14px] text-[#121511] font-semibold leading-relaxed">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT — Summary sidebar */}
          <div className="w-[280px] flex-shrink-0 flex flex-col gap-4">
            {/* Order summary */}
            <div className="bg-white rounded-[20px] p-5 border border-[#E8E8E8]">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#6A6C6A] mb-4">Order Summary</p>

              <div className="flex flex-col gap-3 text-[13px] mb-4">
                <div className="flex justify-between">
                  <span className="text-[#6A6C6A]">{pkg?.format || 'Content'} package</span>
                  <span className="font-semibold text-[#121511]">{fmtPrice(order.agreed_price_inr)}</span>
                </div>
                <div className="pt-3 border-t border-[#E8E8E8] flex justify-between">
                  <span className="font-bold text-[#121511]">Total</span>
                  <span className="font-black text-[#163300]">{fmtPrice(order.agreed_price_inr)}</span>
                </div>
              </div>

              {/* Escrow status */}
              <div className={`flex items-center gap-2 p-2.5 rounded-[10px] text-[12px] font-semibold ${isCompleted ? 'bg-green-50 text-green-700' : isDeclined ? 'bg-red-50 text-red-700' : 'bg-[#9FE870]/20 text-[#163300]'}`}>
                <ShieldCheck className="w-4 h-4" />
                {isCompleted ? 'Payment released' : isDeclined ? 'Refunded' : 'Held in escrow'}
              </div>
            </div>

            {/* Revisions tracker */}
            {!isDeclined && (submissions.length > 0 || needsReview) && (
              <div className="bg-white rounded-[20px] p-5 border border-[#E8E8E8]">
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#6A6C6A] mb-3">Revisions</p>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-semibold text-[#121511]">{revisionsUsed} of {revisionsAllowed} used</p>
                  <p className={`text-[12px] font-bold ${revisionsLeft === 0 ? 'text-[#6A6C6A]' : revisionsLeft === 1 ? 'text-orange-600' : 'text-[#163300]'}`}>
                    {revisionsLeft} left
                  </p>
                </div>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: revisionsAllowed }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full ${i < revisionsUsed ? 'bg-orange-400' : 'bg-[#EDEFEB]'}`} />
                  ))}
                </div>
                {revisionsLeft === 0 && (
                  <p className="text-[11px] text-[#6A6C6A]">Revision limit reached — you can only approve now.</p>
                )}
                {revisionsLeft === 1 && (
                  <p className="text-[11px] text-orange-700">1 revision remaining — once used, you can only approve.</p>
                )}
              </div>
            )}

            {/* Order timeline */}
            <div className="bg-white rounded-[20px] p-5 border border-[#E8E8E8]">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#6A6C6A] mb-4">Timeline</p>
              <div className="flex flex-col gap-3">
                {(() => {
                  type TEntry = { label: string; value: string | null; isRevision?: boolean }
                  const entries: TEntry[] = [
                    { label: 'Hire sent', value: fmtDate(order.hired_at) },
                    ...(order.accepted_at ? [{ label: 'Creator accepted', value: fmtDate(order.accepted_at) }] : []),
                    ...submissions.flatMap((sub, i) => {
                      const items: TEntry[] = [{ label: `Submission ${i + 1}`, value: fmtDate(sub.submitted_at) }]
                      if (sub.status === 'revision_requested') {
                        items.push({ label: 'Revision requested', value: sub.reviewed_at ? fmtDate(sub.reviewed_at) : null, isRevision: true })
                      }
                      return items
                    }),
                    { label: isCompleted ? 'Completed' : 'Submission deadline', value: fmtDate(order.brief_golive_date) },
                  ]
                  return entries.map((t, i) => (
                    <div key={i} className={`flex justify-between gap-2 ${t.isRevision ? 'ml-2 pl-2 border-l-2 border-orange-200' : ''}`}>
                      <span className={`text-[12px] ${t.isRevision ? 'text-orange-600' : 'text-[#6A6C6A]'}`}>{t.label}</span>
                      <span className={`text-[12px] font-semibold ${t.value ? 'text-[#121511]' : 'text-[#B0B2AF]'}`}>
                        {t.value || '—'}
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Non-circumvention note */}
            {order.non_circumvention_expiry && (
              <div className="p-4 bg-white rounded-[16px] border border-[#E8E8E8]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#6A6C6A] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#121511]">Platform protection</p>
                    <p className="text-[11px] text-[#6A6C6A] mt-0.5 leading-relaxed">
                      To protect the creator's work, future collaborations with {creator?.display_name || 'this creator'} must go through Crayon until {fmtDate(order.non_circumvention_expiry)}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
