'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IndianRupee, Clock, CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

type Deal = {
  id: string
  agreed_price_inr: number
  status: string
  escrow_status: string
  hired_at: string | null
  accepted_at: string | null
  brand_profiles: { company_name: string; logo_url: string | null } | null
  content_packages: { format: string; platform: string } | null
}

type PaymentDetails = {
  upi_id: string | null
  bank_account_name: string | null
  bank_account_no: string | null
  bank_ifsc: string | null
  bank_name: string | null
}

const PLATFORM_FEE = 0.10

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EarningsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [deals, setDeals] = useState<Deal[]>([])
  const [payment, setPayment] = useState<PaymentDetails>({ upi_id: null, bank_account_name: null, bank_account_no: null, bank_ifsc: null, bank_name: null })
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPayment, setEditingPayment] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ upi_id: '', bank_account_name: '', bank_account_no: '', bank_ifsc: '', bank_name: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id, upi_id, bank_account_name, bank_account_no, bank_ifsc, bank_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) { setLoading(false); return }
    setProfileId(profile.id)
    setPayment({
      upi_id: profile.upi_id,
      bank_account_name: profile.bank_account_name,
      bank_account_no: profile.bank_account_no,
      bank_ifsc: profile.bank_ifsc,
      bank_name: profile.bank_name,
    })
    setForm({
      upi_id: profile.upi_id || '',
      bank_account_name: profile.bank_account_name || '',
      bank_account_no: profile.bank_account_no || '',
      bank_ifsc: profile.bank_ifsc || '',
      bank_name: profile.bank_name || '',
    })

    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id, agreed_price_inr, status, escrow_status, hired_at, accepted_at,
        brand_profiles ( company_name, logo_url ),
        content_packages ( format, platform )
      `)
      .eq('influencer_id', profile.id)
      .order('hired_at', { ascending: false })

    setDeals((contracts || []) as unknown as Deal[])
    setLoading(false)
  }

  async function savePayment() {
    if (!profileId) return
    setSaving(true)
    const { error } = await supabase
      .from('influencer_profiles')
      .update({
        upi_id: form.upi_id || null,
        bank_account_name: form.bank_account_name || null,
        bank_account_no: form.bank_account_no || null,
        bank_ifsc: form.bank_ifsc || null,
        bank_name: form.bank_name || null,
      })
      .eq('id', profileId)

    setSaving(false)
    if (error) { toast.error('Could not save payment details'); return }
    setPayment({ upi_id: form.upi_id || null, bank_account_name: form.bank_account_name || null, bank_account_no: form.bank_account_no || null, bank_ifsc: form.bank_ifsc || null, bank_name: form.bank_name || null })
    setEditingPayment(false)
    toast.success('Payment details saved')
  }

  const released = deals.filter(d => ['approved', 'auto_approved'].includes(d.status))
  const pending = deals.filter(d => ['accepted', 'content_submitted', 'revision_requested'].includes(d.status) && d.escrow_status === 'held')
  const all = deals.filter(d => ['approved', 'auto_approved', 'accepted', 'content_submitted', 'revision_requested'].includes(d.status))

  const totalReleased = released.reduce((s, d) => s + Math.round(d.agreed_price_inr * (1 - PLATFORM_FEE)), 0)
  const totalPending = pending.reduce((s, d) => s + Math.round(d.agreed_price_inr * (1 - PLATFORM_FEE)), 0)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthReleased = released.filter(d => d.hired_at && new Date(d.hired_at) >= thisMonthStart)
  const thisMonthEarned = thisMonthReleased.reduce((s, d) => s + Math.round(d.agreed_price_inr * (1 - PLATFORM_FEE)), 0)
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' })

  const hasPayment = !!(payment.upi_id || payment.bank_account_no)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#163300] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      <div className="px-8 py-8">
        <div className="max-w-[960px]">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[30px] font-black text-[#121511]">Earnings & Payments</h1>
            <p className="text-[15px] text-[#6A6C6A] mt-1">Track your income and manage your payout details.</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#163300] rounded-[24px] p-6">
              <div className="w-10 h-10 rounded-full bg-[#9FE870]/20 flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5 text-[#9FE870]" />
              </div>
              <p className="text-[28px] font-black text-white leading-none">{fmtINR(totalReleased)}</p>
              <p className="text-[13px] text-white/60 mt-1">Total earned (paid out)</p>
            </div>
            <div className="bg-white rounded-[24px] p-6">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-[28px] font-black text-[#121511] leading-none">{fmtINR(totalPending)}</p>
              <p className="text-[13px] text-[#6A6C6A] mt-1">In escrow (pending approval)</p>
            </div>
            <div className="bg-white rounded-[24px] p-6">
              <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-[#163300]" />
              </div>
              <p className="text-[28px] font-black text-[#121511] leading-none">{released.length}</p>
              <p className="text-[13px] text-[#6A6C6A] mt-1">Completed deals</p>
            </div>
            <div className="bg-[#9FE870] rounded-[24px] p-6">
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5 text-[#163300]" />
              </div>
              <p className="text-[28px] font-black text-[#163300] leading-none">{fmtINR(thisMonthEarned)}</p>
              <p className="text-[13px] text-[#163300]/70 mt-1">{monthName} earnings</p>
            </div>
          </div>

          {/* Payout details */}
          <div className="bg-white rounded-[24px] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-black text-[#121511]">Payout details</h2>
                <p className="text-[13px] text-[#6A6C6A] mt-0.5">Add UPI or bank account to receive payments</p>
              </div>
              {!editingPayment && (
                <button
                  onClick={() => setEditingPayment(true)}
                  className="px-4 py-2 rounded-[10px] bg-[#EDEFEB] text-[#163300] text-[13px] font-bold hover:bg-[#9FE870] transition-colors"
                >
                  {hasPayment ? 'Edit' : 'Add'}
                </button>
              )}
            </div>

            {!editingPayment ? (
              hasPayment ? (
                <div className="space-y-3">
                  {payment.upi_id && (
                    <div className="flex items-center gap-3 p-4 rounded-[16px] bg-[#EDEFEB]">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                        <IndianRupee className="w-4 h-4 text-[#163300]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#6A6C6A] uppercase tracking-wide">UPI</p>
                        <p className="text-[14px] font-semibold text-[#121511]">{payment.upi_id}</p>
                      </div>
                    </div>
                  )}
                  {payment.bank_account_no && (
                    <div className="flex items-center gap-3 p-4 rounded-[16px] bg-[#EDEFEB]">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                        <IndianRupee className="w-4 h-4 text-[#163300]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#6A6C6A] uppercase tracking-wide">Bank Account</p>
                        <p className="text-[14px] font-semibold text-[#121511]">
                          {payment.bank_account_name && <span>{payment.bank_account_name} · </span>}
                          ••••{payment.bank_account_no.slice(-4)}
                          {payment.bank_ifsc && <span className="text-[#6A6C6A]"> ({payment.bank_ifsc})</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-[16px] bg-[#EDEFEB]">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <p className="text-[14px] text-[#6A6C6A]">No payout details added yet. Add UPI or bank account to receive payments.</p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">UPI ID</label>
                  <input
                    type="text"
                    value={form.upi_id}
                    onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))}
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#EDEFEB]" />
                  <span className="text-[12px] text-[#6A6C6A]">or bank account</span>
                  <div className="flex-1 h-px bg-[#EDEFEB]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Account Holder Name</label>
                  <input type="text" value={form.bank_account_name} onChange={e => setForm(f => ({ ...f, bank_account_name: e.target.value }))} placeholder="Full name" className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Account Number</label>
                    <input type="text" value={form.bank_account_no} onChange={e => setForm(f => ({ ...f, bank_account_no: e.target.value }))} placeholder="XXXXXXXXXXXXXX" className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">IFSC Code</label>
                    <input type="text" value={form.bank_ifsc} onChange={e => setForm(f => ({ ...f, bank_ifsc: e.target.value.toUpperCase() }))} placeholder="SBIN0000123" className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Bank Name</label>
                  <input type="text" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="e.g. State Bank of India" className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditingPayment(false)} disabled={saving} className="flex-1 py-2.5 rounded-[12px] border border-[#E8E8E8] text-[14px] font-semibold text-[#121511] hover:bg-[#EDEFEB] transition-colors disabled:opacity-50">Cancel</button>
                  <button onClick={savePayment} disabled={saving} className="flex-1 py-2.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-[#9FE870] border-t-transparent rounded-full animate-spin" />Saving…</> : 'Save details'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Platform fee note */}
          <div className="bg-[#9FE870]/20 rounded-[16px] px-5 py-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#163300] flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#163300]">
              Crayon charges a <strong>10% platform fee</strong> on each deal. The amounts shown below are your net payout after the fee is deducted. GST invoices will be available per deal soon.
            </p>
          </div>

          {/* Deals breakdown */}
          <div className="bg-white rounded-[24px] p-6">
            <h2 className="text-[18px] font-black text-[#121511] mb-4">All deals</h2>
            {all.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[15px] font-bold text-[#121511] mb-1">No deals yet</p>
                <p className="text-[13px] text-[#6A6C6A]">Your earnings from completed and active deals will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E8E8]">
                {all.map(deal => {
                  const net = Math.round(deal.agreed_price_inr * (1 - PLATFORM_FEE))
                  const isReleased = ['approved', 'auto_approved'].includes(deal.status)
                  const isPending = ['accepted', 'content_submitted', 'revision_requested'].includes(deal.status)
                  return (
                    <Link
                      key={deal.id}
                      href={`/influencer/orders/${deal.id}`}
                      className="flex items-center gap-4 py-4 -mx-6 px-6 hover:bg-[#EDEFEB] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[13px] font-black flex-shrink-0 overflow-hidden">
                        {deal.brand_profiles?.logo_url
                          ? <img src={deal.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                          : (deal.brand_profiles?.company_name?.[0] || 'B').toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-[#121511] truncate">{deal.brand_profiles?.company_name || '—'}</p>
                        <p className="text-[12px] text-[#6A6C6A] capitalize">{[deal.content_packages?.format, fmtDate(deal.hired_at)].filter(Boolean).join(' · ')}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[15px] font-black text-[#163300]">{fmtINR(net)}</p>
                        <p className="text-[11px] text-[#6A6C6A]">{fmtINR(deal.agreed_price_inr)} − 10%</p>
                      </div>
                      <span className={`ml-2 text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        isReleased ? 'bg-green-50 text-green-700' : isPending ? 'bg-yellow-50 text-yellow-700' : 'bg-[#EDEFEB] text-[#6A6C6A]'
                      }`}>
                        {isReleased ? 'Paid' : 'In escrow'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#B0B2AF] flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
