'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, CheckCircle, XCircle, AlertCircle, Package,
  ChevronRight, Loader2, Search,
} from 'lucide-react'
import { toast } from 'sonner'

type Order = {
  id: string
  agreed_price_inr: number
  status: string
  escrow_status: string
  hired_at: string | null
  auto_approve_at: string | null
  brief_product: string | null
  brief_golive_date: string | null
  brand_profiles: {
    company_name: string
    logo_url: string | null
  } | null
  content_packages: {
    format: string
    platform: string
    delivery_days: number
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_acceptance: {
    label: 'Accept or decline',
    color: 'bg-[#9FE870]/20 text-[#163300] border-[#9FE870]',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  accepted: {
    label: 'In progress',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  content_submitted: {
    label: 'Under review',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  revision_requested: {
    label: 'Revision needed',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  approved: {
    label: 'Paid out',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  auto_approved: {
    label: 'Paid out',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  declined: {
    label: 'Declined',
    color: 'bg-[#EDEFEB] text-[#6A6C6A] border-[#E8E8E8]',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-[#EDEFEB] text-[#6A6C6A] border-[#E8E8E8]',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

const TABS = ['All', 'Pending', 'Active', 'Completed']

function tabMatches(tab: string, status: string) {
  if (tab === 'All') return true
  if (tab === 'Pending') return status === 'pending_acceptance'
  if (tab === 'Active') return ['accepted', 'content_submitted', 'revision_requested'].includes(status)
  if (tab === 'Completed') return ['approved', 'auto_approved', 'declined', 'cancelled'].includes(status)
  return false
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function InfluencerOrdersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) { setLoading(false); return }

    const { data } = await supabase
      .from('contracts')
      .select(`
        id, agreed_price_inr, status, escrow_status, hired_at, auto_approve_at,
        brief_product, brief_golive_date,
        brand_profiles ( company_name, logo_url ),
        content_packages ( format, platform, delivery_days )
      `)
      .eq('influencer_id', profile.id)
      .order('hired_at', { ascending: false })

    setOrders((data || []) as unknown as Order[])
    setLoading(false)
  }

  async function acceptOrder(id: string) {
    setActing(id)
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
      toast.success('Order accepted! Time to start creating.')
      fetchOrders()
    }
    setActing(null)
  }

  async function declineOrder(id: string) {
    setActing(id)
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'declined', escrow_status: 'refunded' })
      .eq('id', id)

    if (error) {
      toast.error('Failed to decline — please try again')
    } else {
      toast.success('Order declined. The brand will be notified.')
      fetchOrders()
    }
    setActing(null)
  }

  const pendingCount = orders.filter(o => o.status === 'pending_acceptance').length

  const filtered = orders.filter(o => {
    const matchTab = tabMatches(tab, o.status)
    const name = o.brand_profiles?.company_name?.toLowerCase() || ''
    const product = o.brief_product?.toLowerCase() || ''
    const matchSearch = !search || name.includes(search.toLowerCase()) || product.includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto">
          <h1 className="text-[28px] font-black text-[#121511]">My Orders</h1>
          <p className="text-[15px] text-[#6A6C6A] mt-0.5">Hire requests and active collaborations</p>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-6">
        {/* Tabs + search */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-2 rounded-[10px] text-[14px] font-semibold transition-colors ${
                  tab === t ? 'bg-[#163300] text-[#9FE870]' : 'bg-white text-[#6A6C6A] hover:bg-[#EDEFEB]'
                }`}
              >
                {t}
                {t === 'Pending' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
            <input
              type="text"
              placeholder="Search brand or product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-[10px] border border-[#E8E8E8] bg-white text-[14px] focus:outline-none focus:border-[#163300] w-56"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#163300]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[20px] p-12 text-center">
            <Package className="w-12 h-12 text-[#B0B2AF] mx-auto mb-4" />
            <p className="text-[18px] font-bold text-[#121511]">
              {orders.length === 0 ? 'No orders yet' : 'No orders match this filter'}
            </p>
            <p className="text-[14px] text-[#6A6C6A] mt-2">
              {orders.length === 0
                ? 'When a brand hires you, it will appear here.'
                : 'Try a different tab or clear your search.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_acceptance
              const isPending = order.status === 'pending_acceptance'
              const isActing = acting === order.id

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-[20px] overflow-hidden border ${
                    isPending ? 'border-[#9FE870] shadow-sm' : 'border-[#E8E8E8]'
                  }`}
                >
                  <div className="p-5 flex items-start gap-4">
                    {/* Brand logo */}
                    <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[14px] font-black flex-shrink-0 overflow-hidden mt-0.5">
                      {order.brand_profiles?.logo_url
                        ? <img src={order.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                        : (order.brand_profiles?.company_name?.[0] || 'B').toUpperCase()
                      }
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-[16px] font-black text-[#121511]">
                            {order.brand_profiles?.company_name || '—'}
                          </p>
                          {(order.content_packages?.format || order.content_packages?.platform) && (
                            <p className="text-[13px] text-[#6A6C6A] capitalize">
                              {[order.content_packages?.format, order.content_packages?.platform].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border flex-shrink-0 ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap text-[13px] text-[#6A6C6A]">
                        <span className="font-black text-[#163300] text-[16px]">
                          ₹{order.agreed_price_inr.toLocaleString('en-IN')}
                        </span>
                        {order.brief_product && (
                          <span>Product: <span className="text-[#121511] font-medium">{order.brief_product}</span></span>
                        )}
                        {order.brief_golive_date && (
                          <span>Deadline: <span className="text-[#121511] font-medium">{fmtDate(order.brief_golive_date)}</span></span>
                        )}
                        <span>Hired: {fmtDate(order.hired_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="px-5 pb-4 flex items-center gap-3">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => declineOrder(order.id)}
                          disabled={!!isActing}
                          className="px-5 py-2.5 rounded-[10px] border-2 border-[#E8E8E8] text-[14px] font-bold text-[#6A6C6A] hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => acceptOrder(order.id)}
                          disabled={!!isActing}
                          className="px-5 py-2.5 rounded-[10px] bg-[#9FE870] text-[#163300] text-[14px] font-black hover:bg-[#8fd960] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Accept order
                        </button>
                        <Link
                          href={`/influencer/orders/${order.id}`}
                          className="ml-auto text-[13px] font-semibold text-[#163300] hover:text-[#9FE870] flex items-center gap-1"
                        >
                          View brief <ChevronRight className="w-4 h-4" />
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/influencer/orders/${order.id}`}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors"
                      >
                        View details <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
