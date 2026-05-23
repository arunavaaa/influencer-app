'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, X, BarChart2, Eye, Heart, MessageCircle } from 'lucide-react'

type TrackedPost = {
  id: string
  post_url: string
  platform: string
  views: number
  likes: number
  comments: number
  engagement_rate: number
  tracked_at: string
  influencer_profiles: { display_name: string } | null
  campaigns: { title: string } | null
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
  youtube: '▶️',
  moj: '🎵',
  sharechat: '🔗',
}

export default function TrackPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<TrackedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [brandId, setBrandId] = useState<string | null>(null)

  const [form, setForm] = useState({
    post_url: '',
    platform: 'instagram',
    views: '',
    likes: '',
    comments: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!brand) { setLoading(false); return }
    setBrandId(brand.id)

    const { data } = await supabase
      .from('tracked_posts')
      .select(`
        id, post_url, platform, views, likes, comments, engagement_rate, tracked_at,
        influencer_profiles(display_name),
        campaigns(title)
      `)
      .eq('brand_id', brand.id)
      .order('tracked_at', { ascending: false })

    setPosts((data || []) as unknown as TrackedPost[])
    setLoading(false)
  }

  async function addPost() {
    if (!form.post_url || !brandId) {
      toast.error('Please enter a post URL')
      return
    }
    setSaving(true)

    const views = parseInt(form.views) || 0
    const likes = parseInt(form.likes) || 0
    const comments = parseInt(form.comments) || 0
    const engagement_rate = views > 0 ? ((likes + comments) / views) * 100 : 0

    const { error } = await supabase.from('tracked_posts').insert({
      brand_id: brandId,
      post_url: form.post_url,
      platform: form.platform,
      views,
      likes,
      comments,
      engagement_rate: Math.round(engagement_rate * 100) / 100,
    })

    if (error) {
      toast.error('Failed to add post')
    } else {
      toast.success('Post tracked!')
      setForm({ post_url: '', platform: 'instagram', views: '', likes: '', comments: '' })
      setShowForm(false)
      fetchData()
    }
    setSaving(false)
  }

  async function deletePost(id: string) {
    await supabase.from('tracked_posts').delete().eq('id', id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
    toast.success('Post removed')
  }

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0)
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0)
  const avgEngagement =
    posts.length > 0
      ? posts.reduce((s, p) => s + (p.engagement_rate || 0), 0) / posts.length
      : 0

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[30px] font-black text-[#121511]">Track Posts</h1>
            <p className="text-[16px] text-[#6A6C6A] mt-1">
              Monitor performance of influencer content
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[15px] px-6 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Track New Post
          </button>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Views', value: totalViews.toLocaleString('en-IN'), icon: Eye },
            { label: 'Total Likes', value: totalLikes.toLocaleString('en-IN'), icon: Heart },
            { label: 'Total Comments', value: totalComments.toLocaleString('en-IN'), icon: MessageCircle },
            { label: 'Avg. Engagement', value: `${avgEngagement.toFixed(2)}%`, icon: BarChart2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#163300]" />
                <p className="text-[12px] text-[#6A6C6A] font-medium">{label}</p>
              </div>
              <p className="text-[25px] font-black text-[#163300]">{value}</p>
            </div>
          ))}
        </div>

        {/* Add post form */}
        {showForm && (
          <div className="bg-white rounded-[24px] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-black text-[#121511]">Track a Post</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:opacity-60">
                <X className="w-5 h-5 text-[#6A6C6A]" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">Post URL *</label>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/p/..."
                  value={form.post_url}
                  onChange={(e) => setForm((p) => ({ ...p, post_url: e.target.value }))}
                  className="w-full text-[14px] px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300]"
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
                  className="w-full text-[14px] px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300] bg-white cursor-pointer"
                >
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              {[
                { key: 'views', label: 'Views', placeholder: '0' },
                { key: 'likes', label: 'Likes', placeholder: '0' },
                { key: 'comments', label: 'Comments', placeholder: '0' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[13px] font-semibold text-[#121511] mb-1.5 block">{label}</label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full text-[14px] px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border-2 border-[#E8E8E8] text-[#6A6C6A] font-semibold text-[14px] py-3 rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={addPost}
                disabled={saving}
                className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[14px] py-3 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Track Post'}
              </button>
            </div>
          </div>
        )}

        {/* Posts table */}
        <div className="bg-white rounded-[24px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart2 className="w-12 h-12 text-[#6A6C6A] mb-4" />
              <p className="text-[18px] font-bold text-[#121511] mb-2">No posts tracked yet</p>
              <p className="text-[14px] text-[#6A6C6A] mb-5">
                Add post URLs to track influencer content performance.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#9FE870] text-[#163300] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
              >
                Track Your First Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#EDEFEB]">
                  <tr>
                    {['Post', 'Platform', 'Views', 'Likes', 'Comments', 'Engagement', 'Date', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[12px] font-bold text-[#6A6C6A] uppercase tracking-wider px-5 py-4"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-t border-[#E8E8E8] hover:bg-[#EDEFEB]/40 transition-colors">
                      <td className="px-5 py-4">
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] font-semibold text-[#163300] hover:text-[#9FE870] transition-colors max-w-[200px] block truncate"
                        >
                          {post.post_url}
                        </a>
                        {post.campaigns?.title && (
                          <p className="text-[12px] text-[#6A6C6A] mt-0.5">
                            {post.campaigns.title}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[16px]">{PLATFORM_ICONS[post.platform] || '🔗'}</span>
                        <span className="text-[13px] text-[#6A6C6A] ml-1 capitalize">{post.platform}</span>
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#121511]">
                        {post.views.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#121511]">
                        {post.likes.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-[14px] font-semibold text-[#121511]">
                        {post.comments.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[14px] font-black ${
                            post.engagement_rate > 3
                              ? 'text-green-600'
                              : post.engagement_rate > 1
                              ? 'text-yellow-600'
                              : 'text-[#6A6C6A]'
                          }`}
                        >
                          {post.engagement_rate.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#6A6C6A]">
                        {new Date(post.tracked_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                        >
                          <X className="w-4 h-4 text-[#6A6C6A] group-hover:text-red-500 transition-colors" />
                        </button>
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
