'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, CheckCircle, Clock, Upload, Loader2,
  Package, AlertCircle, XCircle, Play, FileText,
  ExternalLink, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

type Contract = {
  id: string
  status: string
  escrow_status: string
  agreed_price_inr: number
  hired_at: string | null
  accepted_at: string | null
  auto_approve_at: string | null
  brief_product: string | null
  brief_message: string | null
  brief_dos_donts: string | null
  brief_golive_date: string | null
  brand_profiles: {
    id: string
    company_name: string
    logo_url: string | null
    gst_number: string | null
  } | null
  content_packages: {
    format: string
    platform: string
    delivery_days: number
    revisions_allowed: number
    description: string | null
  } | null
  content_submissions: {
    id: string
    file_url: string
    status: string
    submitted_at: string
    brand_feedback: string | null
    reviewed_at: string | null
  }[] | null
}

const STEPS = [
  { key: 'pending_acceptance', label: 'Hire received' },
  { key: 'accepted', label: 'Creating content' },
  { key: 'content_submitted', label: 'Brand reviewing' },
  { key: 'approved', label: 'Complete' },
]

function getStepIndex(status: string) {
  if (status === 'pending_acceptance') return 0
  if (['accepted', 'revision_requested'].includes(status)) return 1
  if (status === 'content_submitted') return 2
  if (['approved', 'auto_approved'].includes(status)) return 3
  return 0
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
}

export default function CreatorOrderDetail() {
  const supabase = createClient()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const fileRef = useRef<HTMLInputElement>(null)

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitNote, setSubmitNote] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCounter, setShowCounter] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterNote, setCounterNote] = useState('')
  const [submittingCounter, setSubmittingCounter] = useState(false)

  useEffect(() => { fetchContract() }, [id])

  async function fetchContract() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) { router.push('/influencer/home'); return }

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id, status, escrow_status, agreed_price_inr,
        hired_at, accepted_at, auto_approve_at,
        brief_product, brief_message, brief_dos_donts, brief_golive_date,
        brand_profiles ( id, company_name, logo_url, gst_number ),
        content_packages ( format, platform, delivery_days, revisions_allowed, description ),
        content_submissions ( id, file_url, status, submitted_at, brand_feedback, reviewed_at )
      `)
      .eq('id', id)
      .eq('influencer_id', profile.id)
      .single()

    if (error || !data) {
      setFetchError(error?.message || `No data returned. Profile ID: ${profile.id}, Contract ID: ${id}`)
      setLoading(false)
      return
    }
    setContract(data as unknown as Contract)
    setLoading(false)
  }

  async function acceptOrder() {
    setActing(true)
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        auto_approve_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', id)

    if (error) {
      toast.error('Failed to accept — please try again')
    } else {
      toast.success('Order accepted! Read the brief carefully before you start.')
      fetchContract()
    }
    setActing(false)
  }

  async function declineOrder() {
    if (!confirm('Decline this order? The brand will be notified and funds will be refunded.')) return
    setActing(true)
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'declined', escrow_status: 'refunded' })
      .eq('id', id)

    if (error) {
      toast.error('Failed to decline')
    } else {
      toast.success('Order declined.')
      router.push('/influencer/orders')
    }
    setActing(false)
  }

  async function submitCounterOffer() {
    const price = parseInt(counterPrice, 10)
    if (!price || price <= 0) { toast.error('Enter a valid counter price'); return }
    setSubmittingCounter(true)
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'counter_offered',
        counter_price_inr: price,
        counter_note: counterNote || null,
        countered_at: new Date().toISOString(),
      })
      .eq('id', id)
    setSubmittingCounter(false)
    if (error) { toast.error('Failed to send counter-offer'); return }
    toast.success('Counter-offer sent to the brand.')
    setShowCounter(false)
    fetchContract()
  }

  function onFileSelect(file: File) {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  async function submitContent() {
    if (!selectedFile) {
      toast.error('Please upload your content file before submitting')
      return
    }
    setUploading(true)

    let contentUrl = ''

    if (selectedFile) {
      const form = new FormData()
      form.append('file', selectedFile)
      form.append('folder', 'content-submissions')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) {
        toast.error('Upload failed — please try again')
        setUploading(false)
        return
      }
      const { url } = await res.json()
      contentUrl = url
    }

    // Insert content submission
    const { error: subErr } = await supabase
      .from('content_submissions')
      .insert({
        contract_id: id,
        file_url: contentUrl,
        submitted_at: new Date().toISOString(),
      })

    if (subErr) {
      toast.error('Failed to submit — please try again')
      setUploading(false)
      return
    }

    // Update contract status
    const { error: cErr } = await supabase
      .from('contracts')
      .update({ status: 'content_submitted' })
      .eq('id', id)

    if (cErr) {
      toast.error('Submission saved but status update failed')
    } else {
      // Trigger notification email to brand
      fetch('/api/notify/content-submitted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: id }),
      }).catch(() => {/* non-blocking */})

      toast.success('Content submitted for review!')
      setSelectedFile(null)
      setPreviewUrl(null)
      setSubmitNote('')
      fetchContract()
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#163300]" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center p-8">
        <div className="bg-white rounded-[20px] p-8 max-w-xl w-full">
          <p className="text-[14px] font-black text-red-600 mb-2">Failed to load order</p>
          <p className="text-[13px] text-[#6A6C6A] font-mono break-all">{fetchError}</p>
        </div>
      </div>
    )
  }

  if (!contract) return null

  const stepIdx = getStepIndex(contract.status)
  const isPending = contract.status === 'pending_acceptance'
  const isAccepted = contract.status === 'accepted'
  const isSubmitted = contract.status === 'content_submitted'
  const isRevision = contract.status === 'revision_requested'
  const isComplete = ['approved', 'auto_approved'].includes(contract.status)
  const isDeclined = ['declined', 'cancelled'].includes(contract.status)
  const canSubmit = isAccepted || isRevision
  const platformFee = Math.round(contract.agreed_price_inr * 0.1)
  const creatorPayout = contract.agreed_price_inr - platformFee

  const lastSubmission = contract.content_submissions?.sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  )[0]

  const revisionsAllowed = contract.content_packages?.revisions_allowed ?? 2
  const revisionsUsed = Math.max(0, (contract.content_submissions?.length ?? 0) - 1)
  const revisionsLeft = Math.max(0, revisionsAllowed - revisionsUsed)

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-5">
        <div className="max-w-[1360px] mx-auto flex items-center gap-4">
          <Link
            href="/influencer/orders"
            className="flex items-center gap-1.5 text-[14px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Orders
          </Link>
          <span className="text-[#E8E8E8]">/</span>
          <p className="text-[14px] font-bold text-[#121511]">
            {contract.brand_profiles?.company_name || 'Order'}
          </p>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* ── WHAT TO DO NOW BANNER ── */}
            {isPending && (
              <div className="bg-[#163300] rounded-[24px] p-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9FE870] mb-2">Action required</p>
                <p className="text-[20px] font-black text-white mb-1">You've received a hire request</p>
                <p className="text-[14px] text-white/60 mb-4">Review the brief below and accept to start earning {fmtINR(creatorPayout)}, or propose a different price.</p>
                <div className="flex gap-2 flex-wrap text-[13px] font-bold text-white/50">
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span> Review the brief</span>
                  <span className="text-white/20">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span> Accept or negotiate</span>
                  <span className="text-white/20">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span> Create & submit content</span>
                  <span className="text-white/20">→</span>
                  <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">4</span> Get paid</span>
                </div>
              </div>
            )}

            {isAccepted && (() => {
              const deadline = contract.accepted_at && contract.content_packages?.delivery_days
                ? new Date(new Date(contract.accepted_at).getTime() + contract.content_packages.delivery_days * 86_400_000)
                : null
              const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000) : null
              return (
                <div className="bg-[#9FE870] rounded-[24px] p-6">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#163300]/60 mb-2">Your next step</p>
                  <p className="text-[20px] font-black text-[#163300] mb-1">Create and submit your content</p>
                  <p className="text-[14px] text-[#163300]/70 mb-4">
                    Read the brief carefully, create your {contract.content_packages?.format || 'content'}, then upload it below.
                    {daysLeft !== null && (
                      <span className="font-bold text-[#163300]"> You have {daysLeft} day{daysLeft !== 1 ? 's' : ''} left.</span>
                    )}
                  </p>
                  <div className="flex gap-2 flex-wrap text-[13px] font-bold text-[#163300]/50">
                    <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-[#163300]/10 flex items-center justify-center text-[10px] text-[#163300]">1</span> Read the brief below</span>
                    <span className="text-[#163300]/30">→</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-[#163300]/10 flex items-center justify-center text-[10px] text-[#163300]">2</span> Create your {contract.content_packages?.format || 'content'}</span>
                    <span className="text-[#163300]/30">→</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-[#163300]/10 flex items-center justify-center text-[10px] text-[#163300]">3</span> Upload & submit</span>
                  </div>
                </div>
              )
            })()}

            {isRevision && (
              <div className="bg-orange-50 rounded-[24px] p-6 border-2 border-orange-200">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 mb-2">Action required</p>
                <p className="text-[20px] font-black text-orange-900 mb-1">Revision requested by the brand</p>
                <p className="text-[14px] text-orange-800 mb-0">Read their feedback below, make the changes, and resubmit. You have {revisionsLeft} revision{revisionsLeft !== 1 ? 's' : ''} remaining.</p>
              </div>
            )}

            {isSubmitted && (
              <div className="bg-white rounded-[24px] p-6 border-2 border-[#E8E8E8]">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#6A6C6A] mb-2">Waiting on brand</p>
                <p className="text-[20px] font-black text-[#121511] mb-1">Content submitted — nothing to do</p>
                <p className="text-[14px] text-[#6A6C6A]">The brand has 72 hours to approve or request a revision. If they don't respond, it auto-approves and your payment releases automatically.</p>
              </div>
            )}

            {isComplete && (
              <div className="bg-[#163300] rounded-[24px] p-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#9FE870] mb-2">Complete</p>
                <p className="text-[20px] font-black text-white mb-1">You're done — payment released!</p>
                <p className="text-[14px] text-white/60">{fmtINR(creatorPayout)} has been released from escrow to your account.</p>
              </div>
            )}

            {/* Progress stepper */}
            {!isDeclined && (
              <div className="bg-white rounded-[24px] p-6">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-4 h-0.5 bg-[#E8E8E8] mx-8" />
                  <div
                    className="absolute left-0 top-4 h-0.5 bg-[#9FE870] mx-8 transition-all"
                    style={{ width: `${(stepIdx / (STEPS.length - 1)) * 100}%`, right: 'auto' }}
                  />
                  {STEPS.map((step, i) => {
                    const done = i < stepIdx
                    const active = i === stepIdx
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          done ? 'bg-[#9FE870] border-[#9FE870]' :
                          active ? 'bg-white border-[#163300]' :
                          'bg-white border-[#E8E8E8]'
                        }`}>
                          {done
                            ? <CheckCircle className="w-4 h-4 text-[#163300]" />
                            : <span className={`text-[11px] font-black ${active ? 'text-[#163300]' : 'text-[#B0B2AF]'}`}>{i + 1}</span>
                          }
                        </div>
                        <span className={`text-[11px] font-semibold text-center ${active ? 'text-[#163300]' : 'text-[#B0B2AF]'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pending: Accept or Decline */}
            {isPending && (
              <div className="bg-white rounded-[24px] p-6 border-2 border-[#9FE870]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#9FE870] flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-[#163300]" />
                  </div>
                  <div>
                    <p className="text-[16px] font-black text-[#121511]">New hire request</p>
                    <p className="text-[13px] text-[#6A6C6A]">You have 48 hours to accept or decline</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={declineOrder}
                    disabled={acting}
                    className="flex-1 py-3 rounded-[12px] border-2 border-[#E8E8E8] text-[14px] font-bold text-[#6A6C6A] hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={acceptOrder}
                    disabled={acting}
                    className="flex-1 py-3 rounded-[12px] bg-[#9FE870] text-[#163300] text-[14px] font-black hover:bg-[#8fd960] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Accept & start
                  </button>
                </div>

                {/* Counter-offer */}
                {!showCounter ? (
                  <button
                    onClick={() => setShowCounter(true)}
                    className="mt-3 text-[13px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors"
                  >
                    Propose a different price →
                  </button>
                ) : (
                  <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
                    <p className="text-[14px] font-black text-[#121511] mb-3">Propose different price</p>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Your counter price (₹)</label>
                        <input
                          type="number"
                          min={1}
                          value={counterPrice}
                          onChange={e => setCounterPrice(e.target.value)}
                          placeholder={`Brand offered ${fmtINR(contract.agreed_price_inr)}`}
                          className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Note to brand (optional)</label>
                        <textarea
                          value={counterNote}
                          onChange={e => setCounterNote(e.target.value)}
                          placeholder="Explain why you're proposing this price..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300] resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowCounter(false)} className="flex-1 py-2.5 rounded-[12px] border border-[#E8E8E8] text-[14px] font-semibold text-[#121511] hover:bg-[#EDEFEB] transition-colors">Cancel</button>
                        <button
                          onClick={submitCounterOffer}
                          disabled={submittingCounter || !counterPrice}
                          className="flex-1 py-2.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {submittingCounter ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Send counter-offer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Counter-offer sent state */}
            {contract.status === 'counter_offered' && (
              <div className="bg-white rounded-[24px] p-6 border border-[#E8E8E8]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-[#121511] mb-1">Counter-offer sent</p>
                    <p className="text-[13px] text-[#6A6C6A]">You proposed {fmtINR((contract as Contract & { counter_price_inr?: number }).counter_price_inr ?? 0)}. Waiting for the brand to respond.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Revision notes */}
            {isRevision && lastSubmission?.brand_feedback && (
              <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-5">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-black text-orange-800 mb-1">Brand's feedback</p>
                    <p className="text-[13px] text-orange-700 leading-relaxed">{lastSubmission.brand_feedback}</p>
                  </div>
                </div>
              </div>
            )}

            {/* The Brief */}
            <div className="bg-white rounded-[24px] p-6">
              <h2 className="text-[16px] font-black text-[#121511] mb-5">The Brief</h2>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {([
                  { label: 'Product / Service', value: contract.brief_product || null },
                  { label: 'Submission deadline', value: contract.brief_golive_date ? fmtDate(contract.brief_golive_date) : null },
                  contract.content_packages
                    ? { label: 'Content format', value: `${contract.content_packages.format} on ${contract.content_packages.platform}` }
                    : null,
                  contract.content_packages?.delivery_days
                    ? { label: 'Delivery deadline', value: `${contract.content_packages.delivery_days} days` }
                    : null,
                ].filter(Boolean) as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-1">{label}</p>
                    <p className="text-[14px] font-semibold text-[#121511]">{value}</p>
                  </div>
                ))}
              </div>

              {contract.brief_message && (
                <div className="mt-5 pt-5 border-t border-[#E8E8E8]">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-2">Brand message</p>
                  <p className="text-[14px] text-[#121511] leading-relaxed">{contract.brief_message}</p>
                </div>
              )}

              {contract.brief_dos_donts && (
                <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-2">Do&apos;s & Don&apos;ts</p>
                  <p className="text-[14px] text-[#121511] leading-relaxed whitespace-pre-line">{contract.brief_dos_donts}</p>
                </div>
              )}

              {contract.content_packages?.description && (
                <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-2">Package description</p>
                  <p className="text-[14px] text-[#121511] leading-relaxed">{contract.content_packages.description}</p>
                </div>
              )}
            </div>

            {/* Submit content */}
            {canSubmit && (
              <div className="bg-white rounded-[24px] p-6">
                <h2 className="text-[16px] font-black text-[#121511] mb-1">
                  {isRevision ? 'Upload revised content' : 'Submit your content'}
                </h2>
                <p className="text-[13px] text-[#6A6C6A] mb-5">
                  Upload your final video or image. The brand will review and approve before payment is released.
                </p>

                {/* File drop zone */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-[160px] rounded-[16px] border-2 border-dashed border-[#163300]/20 hover:border-[#163300]/50 transition-colors flex flex-col items-center justify-center gap-3 mb-4 overflow-hidden relative"
                >
                  {previewUrl ? (
                    isVideo(selectedFile?.name || '') ? (
                      <div className="relative w-full h-full">
                        <video src={previewUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <p className="absolute bottom-2 left-0 right-0 text-center text-white text-[12px] font-semibold">{selectedFile?.name}</p>
                      </div>
                    ) : (
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-[#163300]/40" />
                      <p className="text-[14px] text-[#6A6C6A]">Upload video or photo</p>
                      <p className="text-[12px] text-[#B0B2AF]">MP4, MOV, JPG, PNG — max 100MB</p>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])}
                />

                <div className="mb-4">
                  <label className="text-[13px] font-bold text-[#121511] mb-1.5 block">
                    Note to brand <span className="font-normal text-[#6A6C6A]">(optional)</span>
                  </label>
                  <textarea
                    value={submitNote}
                    onChange={e => setSubmitNote(e.target.value)}
                    placeholder="Any context for the brand — e.g. 'Shot during golden hour as requested'"
                    rows={3}
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] bg-white text-[14px] focus:outline-none focus:border-[#163300] resize-none"
                  />
                </div>

                <button
                  onClick={submitContent}
                  disabled={uploading || !selectedFile}
                  className="w-full py-3.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[15px] font-black hover:bg-[#1f4a00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : 'Submit for review'}
                </button>
              </div>
            )}

            {/* Previous submissions */}
            {contract.content_submissions && contract.content_submissions.length > 0 && (
              <div className="bg-white rounded-[24px] p-6">
                <h2 className="text-[16px] font-black text-[#121511] mb-4">Submission history</h2>
                <div className="space-y-3">
                  {contract.content_submissions
                    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                    .map((sub, i) => (
                      <div key={sub.id} className="flex items-start gap-3 p-4 rounded-[12px] bg-[#EDEFEB]">
                        <FileText className="w-4 h-4 text-[#6A6C6A] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#121511]">
                            Submission {contract.content_submissions!.length - i}
                            <span className="ml-2 text-[11px] font-normal text-[#6A6C6A]">{fmtDate(sub.submitted_at)}</span>
                          </p>
                          {sub.brand_feedback && (
                            <p className="text-[12px] text-[#6A6C6A] mt-1">
                              {sub.status === 'revision_requested' ? 'Brand feedback: ' : 'Note: '}
                              {sub.brand_feedback}
                            </p>
                          )}
                        </div>
                        {sub.file_url && (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[12px] font-semibold text-[#163300] hover:text-[#9FE870] flex-shrink-0"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-4">
            {/* Brand card */}
            <div className="bg-white rounded-[24px] p-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-3">Brand</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[14px] font-black overflow-hidden flex-shrink-0">
                  {contract.brand_profiles?.logo_url
                    ? <img src={contract.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                    : (contract.brand_profiles?.company_name?.[0] || 'B').toUpperCase()
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-[#121511]">{contract.brand_profiles?.company_name || '—'}</p>
                </div>
              </div>
              {contract.brand_profiles?.gst_number && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#EDEFEB] mb-3">
                  <FileText className="w-3.5 h-3.5 text-[#6A6C6A] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#6A6C6A]">GST</p>
                    <p className="text-[12px] font-semibold text-[#121511]">{contract.brand_profiles.gst_number}</p>
                  </div>
                </div>
              )}
              <Link
                href={`/messages/${contract.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] border border-[#E8E8E8] text-[13px] font-bold text-[#121511] hover:bg-[#EDEFEB] transition-colors"
              >
                Message Brand
              </Link>
            </div>

            {/* Revisions tracker */}
            {(isAccepted || isSubmitted || isRevision || isComplete) && (
              <div className="bg-white rounded-[24px] p-5">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-3">Revisions</p>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[14px] font-semibold text-[#121511]">{revisionsUsed} of {revisionsAllowed} used</p>
                  <p className={`text-[12px] font-bold ${revisionsLeft === 0 ? 'text-red-500' : revisionsLeft === 1 ? 'text-yellow-600' : 'text-[#163300]'}`}>
                    {revisionsLeft} left
                  </p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: revisionsAllowed }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${i < revisionsUsed ? 'bg-orange-400' : 'bg-[#EDEFEB]'}`}
                    />
                  ))}
                </div>
                {revisionsLeft === 0 && (
                  <p className="text-[11px] text-[#6A6C6A] mt-2">All revisions used — the brand can no longer request changes.</p>
                )}
              </div>
            )}

            {/* Payment breakdown */}
            <div className="bg-white rounded-[24px] p-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-4">Payment</p>
              <div className="space-y-3">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#6A6C6A]">Package price</span>
                  <span className="font-semibold text-[#121511]">{fmtINR(contract.agreed_price_inr)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#6A6C6A]">Platform fee (10%)</span>
                  <span className="font-semibold text-red-500">−{fmtINR(platformFee)}</span>
                </div>
                <div className="flex justify-between text-[15px] pt-3 border-t border-[#E8E8E8]">
                  <span className="font-black text-[#121511]">You receive</span>
                  <span className="font-black text-[#163300]">{fmtINR(creatorPayout)}</span>
                </div>
              </div>

              {/* Escrow status */}
              <div className={`mt-4 flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold ${
                contract.escrow_status === 'released'
                  ? 'bg-green-50 text-green-700'
                  : contract.escrow_status === 'held'
                  ? 'bg-blue-50 text-blue-700'
                  : contract.escrow_status === 'refunded'
                  ? 'bg-[#EDEFEB] text-[#6A6C6A]'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {contract.escrow_status === 'released' ? <CheckCircle className="w-4 h-4" /> :
                 contract.escrow_status === 'held' ? <Package className="w-4 h-4" /> :
                 contract.escrow_status === 'refunded' ? <XCircle className="w-4 h-4" /> :
                 <Clock className="w-4 h-4" />}
                {contract.escrow_status === 'released' ? 'Payment released' :
                 contract.escrow_status === 'held' ? 'Funds held in escrow' :
                 contract.escrow_status === 'refunded' ? 'Refunded to brand' :
                 'Payment pending'}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-[24px] p-5">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#6A6C6A] mb-4">Timeline</p>
              <div className="space-y-3 text-[13px]">
                {(() => {
                  type TEntry = { label: string; date: string | null; isRevision?: boolean }
                  const sortedSubs = (contract.content_submissions || [])
                    .slice()
                    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
                  const entries: TEntry[] = [
                    { label: 'Hire received', date: contract.hired_at },
                    ...(contract.accepted_at ? [{ label: 'Accepted', date: contract.accepted_at }] : []),
                    ...sortedSubs.flatMap((sub, i) => {
                      const items: TEntry[] = [{ label: `Submission ${i + 1}`, date: sub.submitted_at }]
                      if (sub.status === 'revision_requested') {
                        items.push({ label: 'Revision requested', date: sub.reviewed_at ?? null, isRevision: true })
                      }
                      return items
                    }),
                    ...(contract.brief_golive_date ? [{ label: 'Submission deadline', date: contract.brief_golive_date }] : []),
                  ]
                  return entries.map((t, i) => (
                    <div key={i} className={`flex justify-between ${t.isRevision ? 'ml-2 pl-2 border-l-2 border-orange-200' : ''}`}>
                      <span className={`text-[#6A6C6A] ${t.isRevision ? 'text-orange-600' : ''}`}>{t.label}</span>
                      <span className={`font-semibold ${t.date ? 'text-[#121511]' : 'text-[#B0B2AF]'}`}>
                        {t.date ? fmtDate(t.date) : '—'}
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
