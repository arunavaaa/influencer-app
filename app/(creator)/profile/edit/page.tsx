'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { NICHES, NICHE_EMOJIS, CITIES, LANGUAGES, PLATFORMS } from '@/lib/types'
import Link from 'next/link'

const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const PKG_TYPES = ['Reel', 'Post', 'Story', 'Long Video', 'Shorts', 'UGC']

export default function ProfileEdit() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatorId, setCreatorId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [profile, setProfile] = useState({ display_name: '', city: '', bio: '', languages: [] as string[], niches: [] as string[], instagram_url: '', instagram_followers: '', youtube_url: '', youtube_subscribers: '' })
  const [packages, setPackages] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: c } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (c) {
        setCreatorId(c.id)
        setUsername(c.username)
        setProfile({ display_name: c.display_name ?? '', city: c.city ?? '', bio: c.bio ?? '', languages: c.languages ?? [], niches: c.niches ?? [], instagram_url: c.instagram_url ?? '', instagram_followers: c.instagram_followers ? String(c.instagram_followers) : '', youtube_url: c.youtube_url ?? '', youtube_subscribers: c.youtube_subscribers ? String(c.youtube_subscribers) : '' })
      }
      const { data: pkgs } = await supabase.from('content_packages').select('*').eq('creator_id', c?.id ?? '').order('created_at')
      setPackages(pkgs ?? [])
      setLoading(false)
    })
  }, [])

  function toggleArr<K extends 'languages' | 'niches'>(k: K, v: string) {
    setProfile(p => ({ ...p, [k]: (p[k] as string[]).includes(v) ? (p[k] as string[]).filter(x => x !== v) : [...(p[k] as string[]), v] }))
  }

  async function save() {
    if (!creatorId) return
    setSaving(true)
    const { error } = await supabase.from('creator_profiles').update({
      ...profile,
      instagram_followers: profile.instagram_followers ? parseInt(profile.instagram_followers) : null,
      youtube_subscribers: profile.youtube_subscribers ? parseInt(profile.youtube_subscribers) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', creatorId)
    if (error) toast.error('Failed to save')
    else toast.success('Profile saved!')
    setSaving(false)
  }

  async function addPackage() {
    if (!creatorId) return
    const { data } = await supabase.from('content_packages').insert({ creator_id: creatorId, platform: 'Instagram', content_type: 'Reel', price_inr: 0, delivery_days: 7, revisions: 2, is_active: true }).select().single()
    if (data) setPackages(prev => [...prev, data])
  }

  async function updatePackage(id: string, field: string, value: unknown) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    await supabase.from('content_packages').update({ [field]: value }).eq('id', id)
  }

  async function deletePackage(id: string) {
    await supabase.from('content_packages').delete().eq('id', id)
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#163300]" /></div>

  return (
    <div className="p-6 md:p-8 max-w-[720px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-black text-[#121511]">Edit Profile</h1>
        {username && <Link href={`/${username}`} target="_blank" className="text-[13px] font-semibold text-[#163300] hover:underline">View Profile →</Link>}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <div><label className={L}>Display Name</label><input className={I} value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} /></div>
          <div><label className={L}>City</label><select className={I} value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}><option value="">Select city</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div>
            <label className={L}>Bio</label>
            <textarea className={`${I} resize-none`} rows={3} maxLength={300} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{profile.bio.length}/300</p>
          </div>
          <div>
            <label className={L}>Languages</label>
            <div className="flex flex-wrap gap-2 mt-1">{LANGUAGES.map(l => <button key={l} onClick={() => toggleArr('languages', l)} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all ${profile.languages.includes(l) ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>{l}</button>)}</div>
          </div>
          <div>
            <label className={L}>Niches</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">{NICHES.filter(n => n !== 'Other').map(n => <button key={n} onClick={() => toggleArr('niches', n)} className={`p-2 rounded-[12px] border-2 text-center transition-all ${profile.niches.includes(n) ? 'border-[#163300] bg-[#163300]/5' : 'border-[#E8E8E8] hover:border-[#163300]/40'}`}><div className="text-[16px]">{NICHE_EMOJIS[n]}</div><p className="text-[10px] font-semibold text-[#121511] leading-tight">{n}</p></button>)}</div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <h3 className="text-[16px] font-black text-[#121511]">Social Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>Instagram URL</label><input className={I} placeholder="https://instagram.com/you" value={profile.instagram_url} onChange={e => setProfile(p => ({ ...p, instagram_url: e.target.value }))} /></div>
            <div><label className={L}>Followers</label><input className={I} type="number" placeholder="Follower count" value={profile.instagram_followers} onChange={e => setProfile(p => ({ ...p, instagram_followers: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>YouTube URL</label><input className={I} placeholder="https://youtube.com/@you" value={profile.youtube_url} onChange={e => setProfile(p => ({ ...p, youtube_url: e.target.value }))} /></div>
            <div><label className={L}>Subscribers</label><input className={I} type="number" placeholder="Subscriber count" value={profile.youtube_subscribers} onChange={e => setProfile(p => ({ ...p, youtube_subscribers: e.target.value }))} /></div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-black text-[#121511]">Content Packages</h3>
            <button onClick={addPackage} className="text-[13px] font-bold text-[#163300] hover:underline">+ Add Package</button>
          </div>
          {packages.length === 0 && <p className="text-[14px] text-[#6A6C6A]">No packages yet. Add one to show brands what you offer.</p>}
          <div className="space-y-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="border border-[#E8E8E8] rounded-[16px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <select className={`${I} text-[13px] py-2`} value={pkg.platform} onChange={e => updatePackage(pkg.id, 'platform', e.target.value)}>{PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}</select>
                    <select className={`${I} text-[13px] py-2`} value={pkg.content_type} onChange={e => updatePackage(pkg.id, 'content_type', e.target.value)}>{PKG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                  <button onClick={() => deletePackage(pkg.id)} className="ml-3 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={`${L} text-[9px]`}>Price (₹)</label><input type="number" className={`${I} text-[13px] py-2`} value={pkg.price_inr || ''} onChange={e => updatePackage(pkg.id, 'price_inr', parseInt(e.target.value) || 0)} /></div>
                  <div><label className={`${L} text-[9px]`}>Days</label><input type="number" className={`${I} text-[13px] py-2`} value={pkg.delivery_days} onChange={e => updatePackage(pkg.id, 'delivery_days', parseInt(e.target.value) || 1)} /></div>
                  <div><label className={`${L} text-[9px]`}>Revisions</label><input type="number" className={`${I} text-[13px] py-2`} value={pkg.revisions} onChange={e => updatePackage(pkg.id, 'revisions', parseInt(e.target.value) || 0)} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={save} disabled={saving} className="bg-[#163300] text-[#9FE870] font-bold text-[15px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
