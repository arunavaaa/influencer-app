'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard, CheckCircle, Clock, XCircle,
  ChevronRight, Download, Zap,
} from 'lucide-react'
import { UpgradeModal } from '@/components/shared/UpgradeModal'

type Transaction = {
  id: string
  agreed_price_inr: number
  status: string
  escrow_status: string
  hired_at: string | null
  influencer_profiles: {
    display_name: string
    profile_photo_url: string | null
  } | null
  content_packages: {
    format: string
    platform: string
  } | null
}

const ESCROW_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: {
    label: 'Payment pending',
    color: 'text-yellow-700 bg-yellow-50',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  held: {
    label: 'Funds held',
    color: 'text-blue-700 bg-blue-50',
    icon: <CreditCard className="w-3.5 h-3.5" />,
  },
  released: {
    label: 'Released',
    color: 'text-green-700 bg-green-50',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  refunded: {
    label: 'Refunded',
    color: 'text-[#6A6C6A] bg-[#EDEFEB]',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

const AVATAR_COLORS = [
  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
]

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function BillingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!brand) { setLoading(false); return }

    const { data } = await supabase
      .from('contracts')
      .select(`
        id, agreed_price_inr, status, escrow_status, hired_at,
        influencer_profiles ( display_name, profile_photo_url ),
        content_packages ( format, platform )
      `)
      .eq('brand_id', brand.id)
      .order('hired_at', { ascending: false })

    setTransactions((data || []) as unknown as Transaction[])
    setLoading(false)
  }

  const totalHeld = transactions
    .filter(t => t.escrow_status === 'held')
    .reduce((s, t) => s + t.agreed_price_inr, 0)

  const totalReleased = transactions
    .filter(t => t.escrow_status === 'released')
    .reduce((s, t) => s + t.agreed_price_inr, 0)

  const totalRefunded = transactions
    .filter(t => t.escrow_status === 'refunded')
    .reduce((s, t) => s + t.agreed_price_inr, 0)

  const platformFeeTotal = Math.round(totalReleased * 0.1)

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {showUpgrade && <UpgradeModal trigger="default" onClose={() => setShowUpgrade(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-black text-[#121511]">Billing</h1>
            <p className="text-[15px] text-[#6A6C6A] mt-0.5">Escrow transactions and payment history</p>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1e4a00] transition-colors"
          >
            <Zap className="w-4 h-4" />
            Upgrade Plan
          </button>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">

        {/* Plan card + stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Current plan */}
          <div className="lg:col-span-1 bg-[#163300] rounded-[20px] p-5 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9FE870] mb-2">Current Plan</p>
              <p className="text-[28px] font-black text-white">FREE</p>
              <p className="text-[13px] text-white/60 mt-1">10% platform commission</p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="mt-4 w-full py-2.5 rounded-[10px] bg-[#9FE870] text-[#163300] text-[13px] font-black hover:bg-[#8fd960] transition-colors"
            >
              Upgrade
            </button>
          </div>

          {/* Stats */}
          {[
            { label: 'Funds in escrow', value: fmtINR(totalHeld), sub: 'currently held' },
            { label: 'Total paid out', value: fmtINR(totalReleased), sub: 'to creators' },
            { label: 'Platform fees paid', value: fmtINR(platformFeeTotal), sub: '10% of released' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-[20px] p-5">
              <p className="text-[12px] text-[#6A6C6A] mb-1">{label}</p>
              <p className="text-[28px] font-black text-[#163300]">{loading ? '…' : value}</p>
              <p className="text-[12px] text-[#B0B2AF] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* How escrow works */}
        <div className="bg-white rounded-[20px] p-5 mb-6 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-[#9FE870] flex items-center justify-center flex-shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4 text-[#163300]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#121511] mb-0.5">How Crayon Escrow works</p>
            <p className="text-[13px] text-[#6A6C6A] leading-relaxed">
              When you hire a creator, funds are held securely in escrow. They are only released to the creator once you approve their content, or automatically after 72 hours. If a creator declines, funds are fully refunded.
            </p>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-[20px] overflow-hidden border border-[#E8E8E8]">
          <div className="px-6 py-4 border-b border-[#E8E8E8] flex items-center justify-between">
            <h2 className="text-[16px] font-black text-[#121511]">Transaction history</h2>
            {transactions.length > 0 && (
              <button className="flex items-center gap-1.5 text-[13px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
          </div>

          {/* Table header */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 bg-[#EDEFEB] border-b border-[#E8E8E8]">
              {['Creator', 'Content', 'Amount', 'Date', 'Status', ''].map(h => (
                <p key={h} className="text-[11px] font-bold uppercase tracking-wider text-[#6A6C6A]">{h}</p>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <CreditCard className="w-10 h-10 text-[#B0B2AF] mx-auto mb-4" />
              <p className="text-[16px] font-bold text-[#121511]">No transactions yet</p>
              <p className="text-[13px] text-[#6A6C6A] mt-1">Hire a creator to see payment history here.</p>
              <Link
                href="/brand/discover"
                className="inline-block mt-5 px-6 py-3 rounded-[12px] bg-[#9FE870] text-[#163300] font-bold text-[14px] hover:bg-[#8fd960] transition-colors"
              >
                Discover Creators
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E8E8]">
              {transactions.map((tx, i) => {
                const escrow = ESCROW_CONFIG[tx.escrow_status] || ESCROW_CONFIG.pending_payment
                const colorIdx = (tx.influencer_profiles?.display_name || '').charCodeAt(0) % AVATAR_COLORS.length
                const av = AVATAR_COLORS[colorIdx]
                const platformFee = Math.round(tx.agreed_price_inr * 0.1)
                const total = tx.agreed_price_inr + platformFee

                return (
                  <Link
                    key={tx.id}
                    href={`/brand/orders/${tx.id}`}
                    className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 hover:bg-[#EDEFEB] transition-colors items-center"
                  >
                    {/* Creator */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black overflow-hidden ${av.bg} ${av.text}`}>
                        {tx.influencer_profiles?.profile_photo_url
                          ? <img src={tx.influencer_profiles.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          : (tx.influencer_profiles?.display_name?.[0] || '?').toUpperCase()
                        }
                      </div>
                      <p className="text-[14px] font-bold text-[#121511] truncate">
                        {tx.influencer_profiles?.display_name || '—'}
                      </p>
                    </div>

                    {/* Content */}
                    <p className="text-[13px] text-[#6A6C6A] capitalize truncate">
                      {[tx.content_packages?.format, tx.content_packages?.platform].filter(Boolean).join(' · ') || 'Campaign hire'}
                    </p>

                    {/* Amount */}
                    <div>
                      <p className="text-[14px] font-bold text-[#121511]">{fmtINR(total)}</p>
                      <p className="text-[11px] text-[#6A6C6A]">incl. fee</p>
                    </div>

                    {/* Date */}
                    <p className="text-[13px] text-[#6A6C6A]">{fmtDate(tx.hired_at)}</p>

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${escrow.color}`}>
                      {escrow.icon}
                      {escrow.label}
                    </span>

                    <ChevronRight className="w-4 h-4 text-[#B0B2AF]" />
                  </Link>
                )
              })}
            </div>
          )}

          {totalRefunded > 0 && (
            <div className="px-6 py-4 border-t border-[#E8E8E8] bg-[#EDEFEB]">
              <p className="text-[13px] text-[#6A6C6A]">
                Total refunded: <span className="font-bold text-[#121511]">{fmtINR(totalRefunded)}</span>
              </p>
            </div>
          )}
        </div>

        {/* GST notice */}
        <p className="text-center text-[12px] text-[#B0B2AF] mt-6">
          GST will be applicable on platform fees as per Indian tax laws · All amounts in INR
        </p>
      </div>
    </div>
  )
}
