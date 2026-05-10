'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  LogOut,
  Plus,
  X,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Package_ = {
  id: string
  format: string
  platform: string
  price_inr: number
  delivery_days: number
  revisions_allowed: number
  description: string
}

const NAV_ITEMS = [
  { href: '/influencer/home', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/influencer/home', icon: Package, label: 'My Packages' },
  { href: '/influencer/campaigns', icon: ShoppingBag, label: 'Campaigns' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
]

const FORMAT_LABEL: Record<string, string> = {
  reel: 'Reel', post: 'Post', story: 'Story', ugc: 'UGC',
  youtube_video: 'YouTube Video', youtube_short: 'YouTube Short',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  youtube: 'bg-red-100 text-red-700',
  moj: 'bg-purple-100 text-purple-700',
  sharechat: 'bg-yellow-100 text-yellow-700',
}

export default function InfluencerHome() {
  const supabase = createClient()
  const [packages, setPackages] = useState<Package_[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [activeNav, setActiveNav] = useState('Dashboard')

  const [form, setForm] = useState({
    format: '',
    platform: '',
    price_inr: '',
    delivery_days: '',
    revisions_allowed: '2',
    description: '',
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id, display_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) return
    setProfileName(profile.display_name || user.email?.split('@')[0] || 'Creator')

    const { data } = await supabase
      .from('content_packages')
      .select('*')
      .eq('influencer_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    setPackages(data || [])
    setLoading(false)
  }

  async function savePackage() {
    if (!form.platform || !form.format || !form.price_inr || !form.delivery_days) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const { error } = await supabase.from('content_packages').insert({
      influencer_id: profile.id,
      format: form.format,
      platform: form.platform,
      price_inr: parseInt(form.price_inr),
      delivery_days: parseInt(form.delivery_days),
      revisions_allowed: parseInt(form.revisions_allowed),
      description: form.description,
    })

    if (error) {
      toast.error('Failed to save package')
    } else {
      toast.success('Package added!')
      setForm({ format: '', platform: '', price_inr: '', delivery_days: '', revisions_allowed: '2', description: '' })
      setAdding(false)
      fetchPackages()
    }
    setSaving(false)
  }

  async function deletePackage(id: string) {
    await supabase.from('content_packages').update({ is_active: false }).eq('id', id)
    toast.success('Package removed')
    fetchPackages()
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const totalRevenue = packages.reduce((s, p) => s + p.price_inr, 0)

  return (
    <div className="min-h-screen bg-[#EDEFEB] flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#E8E8E8] flex flex-col fixed left-0 top-16 bottom-0 z-20">
        <div className="p-6 border-b border-[#E8E8E8]">
          <div className="w-10 h-10 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] text-[16px] font-black mb-3">
            {profileName[0]?.toUpperCase() || '?'}
          </div>
          <p className="text-[14px] font-bold text-[#121511] truncate">{profileName}</p>
          <p className="text-[12px] text-[#6A6C6A]">Influencer</p>
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
          <div className="mb-8">
            <h1 className="text-[30px] font-black text-[#121511]">
              Hey, {profileName.split(' ')[0]} 👋
            </h1>
            <p className="text-[16px] text-[#6A6C6A] mt-1">
              Manage your packages and track your earnings
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              { label: 'Active Packages', value: loading ? '…' : packages.length },
              {
                label: 'Total Package Value',
                value: loading ? '…' : `₹${totalRevenue.toLocaleString('en-IN')}`,
              },
              { label: 'Completed Orders', value: '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-[24px] p-6">
                <p className="text-[37px] font-black text-[#163300]">{s.value}</p>
                <p className="text-[14px] text-[#6A6C6A] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Packages section */}
          <div className="bg-white rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-black text-[#121511]">My Packages</h2>
                <p className="text-[14px] text-[#6A6C6A] mt-0.5">
                  These appear on your public profile for brands to hire you
                </p>
              </div>
              {!adding && (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[14px] px-5 py-2.5 rounded-full hover:bg-[#8fdc60] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Package
                </button>
              )}
            </div>

            {/* Add package form */}
            {adding && (
              <div className="bg-[#EDEFEB] rounded-[16px] p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-[#121511]">New Package</h3>
                  <button onClick={() => setAdding(false)} className="p-1 hover:opacity-60">
                    <X className="w-5 h-5 text-[#6A6C6A]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">Platform *</label>
                    <Select onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                      <SelectTrigger className="rounded-[12px] border-[#E8E8E8] bg-white">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="moj">Moj</SelectItem>
                        <SelectItem value="sharechat">ShareChat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">Format *</label>
                    <Select onValueChange={(v) => setForm((p) => ({ ...p, format: v }))}>
                      <SelectTrigger className="rounded-[12px] border-[#E8E8E8] bg-white">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reel">Reel</SelectItem>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="ugc">UGC</SelectItem>
                        <SelectItem value="youtube_video">YouTube Video</SelectItem>
                        <SelectItem value="youtube_short">YouTube Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { key: 'price_inr', label: 'Price (₹) *', placeholder: 'e.g. 8000', type: 'number' },
                    { key: 'delivery_days', label: 'Delivery (days) *', placeholder: 'e.g. 3', type: 'number' },
                    { key: 'revisions_allowed', label: 'Revisions', placeholder: '2', type: 'number' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full text-[14px] px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300]"
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">
                    Description <span className="text-[#6A6C6A] font-normal">(optional)</span>
                  </label>
                  <input
                    placeholder="e.g. 60-second reel with product showcase and CTA"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full text-[14px] px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAdding(false)}
                    className="flex-1 border-2 border-[#E8E8E8] text-[#6A6C6A] font-semibold text-[14px] py-3 rounded-full hover:border-[#163300] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePackage}
                    disabled={saving}
                    className="flex-1 bg-[#163300] text-[#9FE870] font-bold text-[14px] py-3 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Package'}
                  </button>
                </div>
              </div>
            )}

            {/* Packages list */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="border-2 border-dashed border-[#E8E8E8] rounded-[16px] py-12 text-center">
                <p className="text-[16px] font-bold text-[#121511] mb-1">No packages yet</p>
                <p className="text-[14px] text-[#6A6C6A]">
                  Add your first package so brands can hire you.
                </p>
                <button
                  onClick={() => setAdding(true)}
                  className="mt-5 bg-[#9FE870] text-[#163300] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
                >
                  + Add Package
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between py-4 px-5 bg-[#EDEFEB] rounded-[16px]"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                              PLATFORM_COLORS[pkg.platform] || 'bg-[#E8E8E8] text-[#163300]'
                            }`}
                          >
                            {pkg.platform}
                          </span>
                          <span className="text-[12px] font-medium px-2.5 py-0.5 bg-white text-[#6A6C6A] rounded-full">
                            {FORMAT_LABEL[pkg.format] || pkg.format}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#6A6C6A]">
                          {pkg.delivery_days}d delivery · {pkg.revisions_allowed} revisions
                          {pkg.description && ` · ${pkg.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <p className="text-[18px] font-black text-[#163300]">
                        ₹{pkg.price_inr.toLocaleString('en-IN')}
                      </p>
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="text-[13px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
