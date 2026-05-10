'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Search,
  Megaphone,
  Library,
  BarChart2,
  MessageSquare,
  LogOut,
  Plus,
  ArrowRight,
} from 'lucide-react'

type Campaign = {
  id: string
  title: string
  status: string
  created_at: string
  budget_inr: number
}

const NAV_ITEMS = [
  { href: '/brand/discover', icon: Search, label: 'Discover' },
  { href: '/brand/campaigns', icon: Megaphone, label: 'My Campaigns' },
  { href: '/brand/library', icon: Library, label: 'Library' },
  { href: '/brand/track', icon: BarChart2, label: 'Track' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
]

export default function BrandHome() {
  const supabase = createClient()
  const [brandName, setBrandName] = useState('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('My Campaigns')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('brand_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) return
    setBrandName(profile.company_name || user.email?.split('@')[0] || 'Brand')

    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('id, title, status, created_at, budget_inr')
      .eq('brand_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    setCampaigns(campaignData || [])
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
  const totalSpent = campaigns.reduce((s, c) => s + (c.budget_inr || 0), 0)

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-[#EDEFEB] text-[#6A6C6A]',
    paused: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB] flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col fixed left-0 top-16 bottom-0 z-20">
        <div className="p-6 border-b border-[#E8E8E8]">
          <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] text-[16px] font-black mb-3">
            {brandName[0]?.toUpperCase() || 'B'}
          </div>
          <p className="text-[14px] font-bold text-[#121511] truncate">{brandName}</p>
          <p className="text-[12px] text-[#6A6C6A]">Brand</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-semibold transition-colors ${
                activeNav === label
                  ? 'bg-[#9FE870] text-[#163300]'
                  : 'text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-[#121511]'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E8E8E8]">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-semibold text-[#6A6C6A] hover:bg-[#EDEFEB] hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 ml-[240px] p-8">
        <div className="max-w-[1000px]">
          {/* Greeting */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[30px] font-black text-[#121511]">
                Welcome back, {brandName.split(' ')[0]} 👋
              </h1>
              <p className="text-[16px] text-[#6A6C6A] mt-1">
                Manage your campaigns and discover new creators
              </p>
            </div>
            <Link
              href="/brand/campaigns/new"
              className="flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[15px] px-6 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Post a Campaign
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              { label: 'Active Campaigns', value: loading ? '…' : activeCampaigns },
              {
                label: 'Total Budgeted',
                value: loading ? '…' : `₹${totalSpent.toLocaleString('en-IN')}`,
              },
              { label: 'Creators Hired', value: '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-[24px] p-6">
                <p className="text-[37px] font-black text-[#163300]">{s.value}</p>
                <p className="text-[14px] text-[#6A6C6A] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <Link
              href="/brand/discover"
              className="bg-[#163300] rounded-[24px] p-6 flex items-center justify-between group hover:bg-[#1f4a00] transition-colors"
            >
              <div>
                <p className="text-[18px] font-black text-[#9FE870] mb-1">Discover Creators</p>
                <p className="text-[14px] text-white/70">Browse 10,000+ verified influencers</p>
              </div>
              <div className="w-10 h-10 bg-[#9FE870] rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#163300]" />
              </div>
            </Link>

            <Link
              href="/brand/campaigns/new"
              className="bg-white rounded-[24px] p-6 flex items-center justify-between group hover:border-[#9FE870] border-2 border-transparent transition-colors"
            >
              <div>
                <p className="text-[18px] font-black text-[#163300] mb-1">Post a Campaign</p>
                <p className="text-[14px] text-[#6A6C6A]">Reach creators with your brief</p>
              </div>
              <div className="w-10 h-10 bg-[#EDEFEB] rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#9FE870] transition-colors">
                <Plus className="w-5 h-5 text-[#163300]" />
              </div>
            </Link>
          </div>

          {/* Recent campaigns */}
          <div className="bg-white rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[20px] font-black text-[#121511]">Recent Campaigns</h2>
              <Link
                href="/brand/campaigns"
                className="text-[14px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors"
              >
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="border-2 border-dashed border-[#E8E8E8] rounded-[16px] py-12 text-center">
                <p className="text-[16px] font-bold text-[#121511] mb-1">No campaigns yet</p>
                <p className="text-[14px] text-[#6A6C6A] mb-5">
                  Post your first campaign to start hiring creators.
                </p>
                <Link
                  href="/brand/campaigns/new"
                  className="inline-flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post First Campaign
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E8E8]">
                      {['Campaign', 'Status', 'Budget', 'Date'].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[12px] font-bold text-[#6A6C6A] uppercase tracking-wider pb-3 pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-[#E8E8E8] last:border-0">
                        <td className="py-4 pr-4">
                          <Link
                            href={`/brand/campaigns/${c.id}`}
                            className="text-[15px] font-semibold text-[#121511] hover:text-[#163300] transition-colors"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`text-[12px] font-bold px-3 py-1 rounded-full capitalize ${
                              STATUS_COLORS[c.status] || 'bg-[#EDEFEB] text-[#6A6C6A]'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-[15px] font-bold text-[#163300]">
                            {c.budget_inr ? `₹${c.budget_inr.toLocaleString('en-IN')}` : '—'}
                          </span>
                        </td>
                        <td className="py-4 text-[14px] text-[#6A6C6A]">
                          {new Date(c.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
