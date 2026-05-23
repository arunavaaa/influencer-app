'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { NICHES, CITIES, PLATFORMS } from '@/lib/types'

const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

export default function BrandProfile() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [data, setData] = useState({ brand_name: '', website_url: '', type: '', niche: '', description: '', city: '', team_size: '', instagram_url: '', youtube_url: '', platforms: [] as string[] })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: brand } = await supabase.from('brand_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (brand) {
        setProfileId(brand.id)
        setData({ brand_name: brand.brand_name ?? '', website_url: brand.website_url ?? '', type: brand.type ?? '', niche: brand.niche ?? '', description: brand.description ?? '', city: brand.city ?? '', team_size: brand.team_size ?? '', instagram_url: brand.instagram_url ?? '', youtube_url: brand.youtube_url ?? '', platforms: brand.platforms ?? [] })
      }
      setLoading(false)
    })
  }, [])

  function toggle(v: string) { setData(p => ({ ...p, platforms: p.platforms.includes(v) ? p.platforms.filter(x => x !== v) : [...p.platforms, v] })) }

  async function save() {
    if (!profileId) return
    setSaving(true)
    const { error } = await supabase.from('brand_profiles').update({ ...data, updated_at: new Date().toISOString() }).eq('id', profileId)
    if (error) toast.error('Failed to save')
    else toast.success('Profile saved!')
    setSaving(false)
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#163300]" /></div>

  return (
    <div className="p-6 md:p-8 max-w-[720px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-6">Edit Brand Profile</h1>
      <div className="space-y-6">
        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <div><label className={L}>Brand Name</label><input className={I} value={data.brand_name} onChange={e => setData(p => ({ ...p, brand_name: e.target.value }))} /></div>
          <div><label className={L}>Website URL</label><input className={I} placeholder="https://yourbrand.com" value={data.website_url} onChange={e => setData(p => ({ ...p, website_url: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={L}>Type</label><select className={I} value={data.type} onChange={e => setData(p => ({ ...p, type: e.target.value }))}><option value="">Select</option><option value="product">Product-based</option><option value="service">Service-based</option></select></div>
            <div><label className={L}>Niche</label><select className={I} value={data.niche} onChange={e => setData(p => ({ ...p, niche: e.target.value }))}><option value="">Select</option>{NICHES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          </div>
          <div><label className={L}>Description</label><textarea className={`${I} resize-none`} rows={3} maxLength={300} value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={L}>City</label><select className={I} value={data.city} onChange={e => setData(p => ({ ...p, city: e.target.value }))}><option value="">Select</option>{CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={L}>Team Size</label><select className={I} value={data.team_size} onChange={e => setData(p => ({ ...p, team_size: e.target.value }))}><option value="">Select</option>{['1–10','11–50','51–200','200+'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-6 space-y-5">
          <div><label className={L}>Instagram URL</label><input className={I} placeholder="https://instagram.com/yourbrand" value={data.instagram_url} onChange={e => setData(p => ({ ...p, instagram_url: e.target.value }))} /></div>
          <div><label className={L}>YouTube URL</label><input className={I} placeholder="https://youtube.com/@yourbrand" value={data.youtube_url} onChange={e => setData(p => ({ ...p, youtube_url: e.target.value }))} /></div>
          <div>
            <label className={L}>Platforms</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PLATFORMS.map(p => <button key={p} onClick={() => toggle(p)} className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${data.platforms.includes(p) ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>{p}</button>)}
            </div>
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
