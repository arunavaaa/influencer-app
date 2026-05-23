'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock, CheckCircle, XCircle, AlertCircle,
  FileText, ChevronRight, Package, Loader2, Search,
} from 'lucide-react'

type Order = {
  id: string
  agreed_price_inr: number
  status: string
  escrow_status: string
  hired_at: string | null
  accepted_at: string | null
  auto_approve_at: string | null
  brief_product: string | null
  brief_golive_date: string | null
  influencer_profiles: {
    id: string
    display_name: string
    profile_photo_url: string | null
  } | null
  content_packages: {
    format: string
    platform: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_acceptance: {
    label: 'Awaiting acceptance',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  accepted: {
    label: 'In progress',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  content_submitted: {
    label: 'Review content',
    color: 'bg-[#9FE870]/30 text-[#163300] border-[#9FE870]',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  revision_requested: {
    label: 'Revision requested',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  approved: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  auto_approved: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  declined: {
    label: 'Declined',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-[#EDEFEB] text-[#6A6C6A] border-[#E8E8E8]',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
}

const AVATAR_COLORS = [
  { bg: 'bg-[#9FE870]', text: 'text-[#163300]' },
  { bg: 'bg-[#163300]', text: 'text-[#9FE870]' },
  { bg: 'bg-[#EDEFEB]', text: 'text-[#163300]' },
]

function fmtPrice(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TABS = ['All', 'Active', 'Review needed', 'Completed']

function tabMatches(tab: string, status: string) {
  if (tab === 'All') return true
  if (tab === 'Active') return ['pending_acceptance', 'accepted', 'revision_requested'].includes(status)
  if (tab === 'Review needed') return status === 'content_submitted'
  if (tab === 'Completed') return ['approved', 'auto_approved', 'declined', 'cancelled'].includes(status)
  return false
}

export default function OrdersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
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
        id, agreed_price_inr, status, escrow_status,
        hired_at, accepted_at, auto_approve_at,
        brief_product, brief_golive_date,
        influencer_profiles ( id, display_name, profile_photo_url ),
        content_packages ( format, platform )
      `)
      .eq('brand_id', brand.id)
      .order('hired_at', { ascending: false })

    setOrders((data || []) as unknown as Order[])
    setLoading(false)
  }

  const reviewNeededCount = orders.filter(o => o.status === 'content_submitted').length

  const filtered = orders.filter(o => {
    const matchTab = tabMatches(tab, o.status)
    const name = o.influencer_profiles?.display_name?.toLowerCase() || ''
    const product = o.brief_product?.toLowerCase() || ''
    const matchSearch = !search || name.includes(search.toLowerCase()) || product.includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] font-black text-[#121511]">My Orders</h1>
            <p className="text-[15px] text-[#6A6C6A] mt-0.5">Track all your hires in one place</p>
          </div>
          <Link
            href="/brand/discover"
            className="px-5 py-3 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1e4a00] transition-colors"
          >
            + Hire a Creator
          </Link>
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
                className={`px-4 py-2 rounded-[10px] text-[14px] font-semibold transition-colors relative ${tab === t ? 'bg-[#163300] text-[#9FE870]' : 'bg-white text-[#6A6C6A] hover:bg-[#EDEFEB]'}`}
              >
                {t}
                {t === 'Review needed' && reviewNeededCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {reviewNeededCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
            <input
              type="text"
              placeholder="Search creator or product..."
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
              {orders.length === 0 ? 'Discover creators and make your first hire.' : 'Try a different tab or search term.'}
            </p>
            {orders.length === 0 && (
              <Link
                href="/brand/discover"
                className="inline-block mt-6 px-6 py-3 rounded-[12px] bg-[#9FE870] text-[#163300] text-[15px] font-bold hover:bg-[#8fd960] transition-colors"
              >
                Discover Creators
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[20px] overflow-hidden border border-[#E8E8E8]">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 border-b border-[#E8E8E8] bg-[#EDEFEB]">
              {['Creator', 'Product', 'Package', 'Go-live', 'Status', ''].map(h => (
                <p key={h} className="text-[11px] font-bold uppercase tracking-wider text-[#6A6C6A]">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-[#E8E8E8]">
              {filtered.map(order => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_acceptance
                const colorIdx = (order.influencer_profiles?.display_name || '').charCodeAt(0) % AVATAR_COLORS.length
                const av = AVATAR_COLORS[colorIdx]
                const needsAction = order.status === 'content_submitted'

                return (
                  <Link
                    key={order.id}
                    href={`/brand/orders/${order.id}`}
                    className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-4 px-6 py-4 hover:bg-[#EDEFEB] transition-colors items-center ${needsAction ? 'bg-[#9FE870]/5' : ''}`}
                  >
                    {/* Creator */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[14px] font-black overflow-hidden ${av.bg} ${av.text}`}>
                        {order.influencer_profiles?.profile_photo_url
                          ? <img src={order.influencer_profiles.profile_photo_url} alt="" className="w-full h-full object-cover" />
                          : (order.influencer_profiles?.display_name?.[0] || '?').toUpperCase()
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#121511] truncate">
                          {order.influencer_profiles?.display_name || '—'}
                        </p>
                        <p className="text-[12px] text-[#6A6C6A]">{fmtPrice(order.agreed_price_inr)}</p>
                      </div>
                    </div>

                    {/* Product */}
                    <p className="text-[13px] text-[#6A6C6A] truncate">{order.brief_product || '—'}</p>

                    {/* Package */}
                    <p className="text-[13px] font-semibold text-[#121511] capitalize">
                      {order.content_packages?.format || 'Campaign'}
                    </p>

                    {/* Go-live */}
                    <p className="text-[13px] text-[#6A6C6A]">{fmtDate(order.brief_golive_date)}</p>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-[#B0B2AF]" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
