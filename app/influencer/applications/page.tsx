'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ClipboardList, ChevronRight, Clock, CheckCircle, XCircle, MinusCircle, MessageSquare } from 'lucide-react'

type Application = {
  id: string
  status: string
  proposed_price_inr: number | null
  cover_note: string | null
  updated_at: string
  campaign_id: string
  campaigns: {
    id: string
    title: string
    budget_inr: number | null
    deadline: string | null
    brand_profiles: { company_name: string; logo_url: string | null } | null
  } | null
  contracts?: { id: string }[] | null
}

type Tab = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

const TABS: { key: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'pending', label: 'Pending', Icon: Clock },
  { key: 'accepted', label: 'Accepted', Icon: CheckCircle },
  { key: 'rejected', label: 'Rejected', Icon: XCircle },
  { key: 'withdrawn', label: 'Withdrawn', Icon: MinusCircle },
]

const TAB_STYLES: Record<Tab, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  withdrawn: 'bg-[#EDEFEB] text-[#6A6C6A] border-[#E8E8E8]',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ApplicationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [withdrawing, setWithdrawing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) { setLoading(false); return }

    const { data } = await supabase
      .from('applications')
      .select(`
        id, status, proposed_price_inr, cover_note, updated_at, campaign_id,
        campaigns (
          id, title, budget_inr, deadline,
          brand_profiles ( company_name, logo_url )
        ),
        contracts ( id )
      `)
      .eq('influencer_id', profile.id)
      .order('updated_at', { ascending: false })

    setApplications((data || []) as unknown as Application[])
    setLoading(false)
  }

  async function withdraw(applicationId: string) {
    if (!confirm('Withdraw this application? This cannot be undone.')) return
    setWithdrawing(applicationId)
    const { error } = await supabase
      .from('applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId)
    setWithdrawing(null)
    if (error) { toast.error('Could not withdraw — please try again'); return }
    toast.success('Application withdrawn')
    setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'withdrawn' } : a))
  }

  const filtered = applications.filter(a => a.status === activeTab)
  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    withdrawn: applications.filter(a => a.status === 'withdrawn').length,
  }

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
        <div className="max-w-[720px]">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[28px] font-black text-[#121511]">Applications</h1>
            <p className="text-[14px] text-[#6A6C6A] mt-1">Track all your campaign applications.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${
                  activeTab === key
                    ? 'bg-[#163300] text-white'
                    : 'bg-white text-[#6A6C6A] hover:bg-[#EDEFEB] border border-[#E8E8E8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {counts[key] > 0 && (
                  <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    activeTab === key ? 'bg-white/20 text-white' : 'bg-[#EDEFEB] text-[#6A6C6A]'
                  }`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Applications list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-[24px] p-12 text-center">
              <ClipboardList className="w-8 h-8 text-[#D0D2CF] mx-auto mb-3" />
              <p className="text-[15px] font-bold text-[#121511] mb-1">
                {activeTab === 'pending' ? 'No pending applications' :
                 activeTab === 'accepted' ? 'No accepted applications yet' :
                 activeTab === 'rejected' ? 'No rejections' : 'No withdrawn applications'}
              </p>
              <p className="text-[13px] text-[#6A6C6A]">
                {activeTab === 'pending'
                  ? 'Apply to campaigns to see them here.'
                  : 'Your applications in this status will appear here.'}
              </p>
              {activeTab === 'pending' && (
                <Link
                  href="/influencer/campaigns"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#163300] hover:underline"
                >
                  Discover campaigns →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(app => {
                const brand = app.campaigns?.brand_profiles
                const contractId = app.contracts?.[0]?.id
                const style = TAB_STYLES[app.status as Tab] || TAB_STYLES.withdrawn
                return (
                  <div key={app.id} className="bg-white rounded-[20px] p-5">
                    {/* Top row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[13px] font-black flex-shrink-0 overflow-hidden">
                        {brand?.logo_url
                          ? <img src={brand.logo_url} alt="" className="w-full h-full object-cover" />
                          : (brand?.company_name?.[0] || 'B').toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-[#121511] truncate">
                          {app.campaigns?.title || 'Campaign'}
                        </p>
                        <p className="text-[12px] text-[#6A6C6A]">{brand?.company_name || '—'}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${style}`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Details row */}
                    <div className="flex items-center gap-4 text-[12px] text-[#6A6C6A] mb-3 flex-wrap">
                      {app.proposed_price_inr && (
                        <span className="font-semibold text-[#163300]">
                          Proposed: ₹{app.proposed_price_inr.toLocaleString('en-IN')}
                        </span>
                      )}
                      {app.campaigns?.budget_inr && (
                        <span>Budget: ₹{app.campaigns.budget_inr.toLocaleString('en-IN')}</span>
                      )}
                      {app.campaigns?.deadline && (
                        <span>Deadline: {fmtDate(app.campaigns.deadline)}</span>
                      )}
                      <span>Applied: {fmtDate(app.updated_at)}</span>
                    </div>

                    {/* Cover note preview */}
                    {app.cover_note && (
                      <p className="text-[12px] text-[#6A6C6A] bg-[#EDEFEB] rounded-[10px] px-3 py-2 mb-3 line-clamp-2">
                        {app.cover_note}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {app.status === 'accepted' && contractId && (
                        <Link
                          href={`/influencer/orders/${contractId}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#163300] text-[#9FE870] text-[12px] font-bold hover:bg-[#1f4a00] transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          View order
                        </Link>
                      )}
                      {contractId && (
                        <Link
                          href={`/messages/${contractId}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[#121511] text-[12px] font-bold hover:bg-[#EDEFEB] transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message brand
                        </Link>
                      )}
                      {app.status === 'pending' && (
                        <button
                          onClick={() => withdraw(app.id)}
                          disabled={withdrawing === app.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[#6A6C6A] text-[12px] font-semibold hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          {withdrawing === app.id ? 'Withdrawing…' : 'Withdraw'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
