'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter } from 'lucide-react'

type ContentItem = {
  id: string
  submitted_at: string
  status: string
  file_url: string | null
  contract: {
    id: string
    influencer_profiles: { display_name: string }
    campaigns: { title: string } | null
    content_packages: { platform: string; format: string }
  }
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  auto_approved: 'bg-green-100 text-green-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  revision_requested: 'bg-orange-100 text-orange-700',
}

export default function LibraryPage() {
  const supabase = createClient()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')

  useEffect(() => {
    fetchLibrary()
  }, [])

  async function fetchLibrary() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!brand) { setLoading(false); return }

    const { data } = await supabase
      .from('content_submissions')
      .select(`
        id, submitted_at, status, file_url,
        contract:contracts(
          id,
          influencer_profiles(display_name),
          campaigns(title),
          content_packages(platform, format)
        )
      `)
      .eq('contracts.brand_id', brand.id)
      .order('submitted_at', { ascending: false })

    setItems((data || []) as unknown as ContentItem[])
    setLoading(false)
  }

  const filtered = items.filter((item) => {
    const creator = item.contract?.influencer_profiles?.display_name?.toLowerCase() || ''
    const campaign = item.contract?.campaigns?.title?.toLowerCase() || ''
    const platform = item.contract?.content_packages?.platform?.toLowerCase() || ''

    const matchSearch = !search || creator.includes(search.toLowerCase()) || campaign.includes(search.toLowerCase())
    const matchPlatform = !platformFilter || platform.includes(platformFilter.toLowerCase())
    const matchCampaign = !campaignFilter || campaign.includes(campaignFilter.toLowerCase())

    return matchSearch && matchPlatform && matchCampaign
  })

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[30px] font-black text-[#121511]">Content Library</h1>
            <p className="text-[16px] text-[#6A6C6A] mt-1">All delivered content in one place</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-4">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
            <input
              type="text"
              placeholder="Search creator or campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[14px] pl-9 pr-4 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] w-64"
            />
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-[14px] pl-4 pr-10 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
          >
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="moj">Moj</option>
            <option value="sharechat">ShareChat</option>
          </select>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="text-[14px] pl-4 pr-10 py-2 rounded-full border border-[#E8E8E8] bg-white focus:outline-none focus:border-[#163300] cursor-pointer appearance-none"
          >
            <option value="">All Campaigns</option>
          </select>
          <div className="ml-auto text-[14px] text-[#6A6C6A]">
            {filtered.length} items
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        <div className="bg-white rounded-[24px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#EDEFEB] rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-[#6A6C6A]" />
              </div>
              <p className="text-[18px] font-bold text-[#121511] mb-2">No content yet</p>
              <p className="text-[14px] text-[#6A6C6A]">
                Completed content from creators will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#EDEFEB]">
                  <tr>
                    {['Order / Creator', 'Campaign', 'Platform', 'Date', 'Status', 'File'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[12px] font-bold text-[#6A6C6A] uppercase tracking-wider px-6 py-4"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-[#E8E8E8] hover:bg-[#EDEFEB]/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-[15px] font-semibold text-[#121511]">
                          {item.contract?.influencer_profiles?.display_name || '—'}
                        </p>
                        <p className="text-[12px] text-[#6A6C6A] capitalize">
                          {item.contract?.content_packages?.format || ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] text-[#121511]">
                          {item.contract?.campaigns?.title || 'Direct Hire'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-medium px-3 py-1 bg-[#EDEFEB] text-[#163300] rounded-full capitalize">
                          {item.contract?.content_packages?.platform || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#6A6C6A]">
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[12px] font-bold px-3 py-1 rounded-full capitalize ${
                            STATUS_COLORS[item.status] || 'bg-[#EDEFEB] text-[#6A6C6A]'
                          }`}
                        >
                          {item.status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.file_url ? (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[14px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors"
                          >
                            View →
                          </a>
                        ) : (
                          <span className="text-[14px] text-[#6A6C6A]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
