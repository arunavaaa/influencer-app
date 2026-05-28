'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { NICHES, CITIES } from '@/lib/types'
import { AppSelect } from '@/components/ui/app-select'

const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const EXTRA_SOCIALS = [
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/yourbrand' },
  { key: 'x_url',        label: 'X',        placeholder: 'https://x.com/yourbrand' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourbrand' },
]

export default function BrandProfile() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [profileId, setProfileId]       = useState<string | null>(null)
  const [logoUrl, setLogoUrl]           = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [data, setData] = useState({
    brand_name: '', website_url: '', type: '', niche: '', description: '',
    city: '', team_size: '', instagram_url: '', youtube_url: '',
  })
  const [extraUrls, setExtraUrls] = useState<Record<string, string>>({
    facebook_url: '', x_url: '', linkedin_url: '',
  })
  const [extraOpen, setExtraOpen] = useState<Record<string, boolean>>({
    facebook_url: false, x_url: false, linkedin_url: false,
  })

  // Unsaved-changes guard
  const [isDirty, setIsDirty]               = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [pendingNavUrl, setPendingNavUrl]   = useState<string | null>(null)

  useEffect(() => {
    if (!isDirty) return

    // Catch browser close / refresh / address-bar navigation
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', beforeUnload)

    // Catch in-app link clicks BEFORE Next.js Link handler fires (capture phase)
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (anchor.target === '_blank') return
      const destPath = href.split('?')[0]
      if (destPath === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      setPendingNavUrl(href)
      setShowLeaveModal(true)
    }
    document.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [isDirty])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: brand } = await supabase.from('brand_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (brand) {
        setProfileId(brand.id)
        setLogoUrl(brand.logo_url ?? null)
        setData({
          brand_name:    brand.brand_name ?? '',
          website_url:   brand.website_url ?? '',
          type:          brand.type ?? '',
          niche:         brand.niche ?? '',
          description:   brand.description ?? '',
          city:          brand.city ?? '',
          team_size:     brand.team_size ?? '',
          instagram_url: brand.instagram_url ?? '',
          youtube_url:   brand.youtube_url ?? '',
        })
        const links = brand.other_social_links ?? {}
        const urls = {
          facebook_url: links.facebook_url ?? '',
          x_url:        links.x_url ?? '',
          linkedin_url: links.linkedin_url ?? '',
        }
        setExtraUrls(urls)
        setExtraOpen({
          facebook_url: !!urls.facebook_url,
          x_url:        !!urls.x_url,
          linkedin_url: !!urls.linkedin_url,
        })
      }
      setLoading(false)
    })
  }, [])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profileId) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Unsupported format — please upload a JPG or PNG file.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image too large — max size is 2 MB. Please compress and try again.'); return }
    const dimUrl = URL.createObjectURL(file)
    const img = new window.Image()
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = dimUrl })
    URL.revokeObjectURL(dimUrl)
    if (img.width < 200 || img.height < 200) { toast.error(`Image too small — minimum 200×200px required (yours is ${img.width}×${img.height}px).`); return }
    setLogoUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLogoUploading(false); return }
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage.from('brand-logos').upload(`${user.id}/logo.${ext}`, file, { upsert: true })
    if (error) { toast.error(error.message || 'Failed to upload logo'); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('brand-logos').getPublicUrl(`${user.id}/logo.${ext}`)
    await supabase.from('brand_profiles').update({ logo_url: publicUrl }).eq('id', profileId)
    setLogoUrl(publicUrl)
    toast.success('Logo updated!')
    setLogoUploading(false)
  }

  async function handleLogoRemove() {
    if (!profileId) return
    const { error } = await supabase.from('brand_profiles').update({ logo_url: null }).eq('id', profileId)
    if (error) { toast.error('Failed to remove logo'); return }
    setLogoUrl(null)
    toast.success('Logo removed')
  }

  function toggleExtra(key: string) {
    const willClose = extraOpen[key]
    if (willClose) setExtraUrls(p => ({ ...p, [key]: '' }))
    setIsDirty(true)
    setExtraOpen(p => ({ ...p, [key]: !p[key] }))
  }

  async function save(): Promise<boolean> {
    if (!profileId) return false
    setSaving(true)
    const otherLinks = Object.fromEntries(Object.entries(extraUrls).filter(([, v]) => v.trim()))
    const { error } = await supabase.from('brand_profiles').update({
      ...data,
      other_social_links: Object.keys(otherLinks).length ? otherLinks : null,
      updated_at: new Date().toISOString(),
    }).eq('id', profileId)
    setSaving(false)
    if (error) { toast.error('Failed to save'); return false }
    toast.success('Profile saved!')
    setIsDirty(false)
    return true
  }

  function confirmLeave() {
    const url = pendingNavUrl
    setIsDirty(false)
    setShowLeaveModal(false)
    setPendingNavUrl(null)
    if (url) router.push(url)
  }

  async function saveAndLeave() {
    const ok = await save()
    if (ok) confirmLeave()
  }

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#163300]" /></div>

  return (
    <>
      <div className="p-6 md:p-8 max-w-[720px]">
        <h1 className="text-[28px] font-black text-[#121511] mb-6">Edit Brand Profile</h1>
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] p-6 space-y-5">

            {/* Logo */}
            <div className="flex items-center gap-4 pb-2">
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <label htmlFor="logo-upload" className="cursor-pointer group relative">
                <div className="w-16 h-16 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[22px] overflow-hidden">
                  {logoUrl
                    ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    : <span>{data.brand_name?.[0]?.toUpperCase() || 'B'}</span>}
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {logoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </label>
              <div>
                <p className="text-[14px] font-semibold text-[#121511]">Brand Logo</p>
                <p className="text-[12px] text-[#6A6C6A]">{logoUploading ? 'Uploading…' : 'Click avatar to change'}</p>
                <p className="text-[11px] text-[#9A9C9A] mt-0.5">Min 200×200px · JPG or PNG · Max 2 MB</p>
                {logoUrl && !logoUploading && (
                  <button type="button" onClick={handleLogoRemove}
                    className="mt-1.5 text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                    Remove logo
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className={L}>Brand Name</label>
              <input className={I} value={data.brand_name}
                onChange={e => { setIsDirty(true); setData(p => ({ ...p, brand_name: e.target.value })) }} />
            </div>

            <div>
              <label className={L}>Website URL</label>
              <input className={I} placeholder="https://yourbrand.com" value={data.website_url}
                onChange={e => { setIsDirty(true); setData(p => ({ ...p, website_url: e.target.value })) }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={L}>Type</label>
                <AppSelect className={I} value={data.type}
                  onChange={e => { setIsDirty(true); setData(p => ({ ...p, type: e.target.value })) }}>
                  <option value="">Select</option>
                  <option value="product">Product-based</option>
                  <option value="service">Service-based</option>
                </AppSelect>
              </div>
              <div>
                <label className={L}>Niche</label>
                <AppSelect className={I} value={data.niche}
                  onChange={e => { setIsDirty(true); setData(p => ({ ...p, niche: e.target.value })) }}>
                  <option value="">Select</option>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </AppSelect>
              </div>
            </div>

            <div>
              <label className={L}>Description</label>
              <textarea className={`${I} resize-none`} rows={3} maxLength={300} value={data.description}
                onChange={e => { setIsDirty(true); setData(p => ({ ...p, description: e.target.value })) }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={L}>City</label>
                <AppSelect className={I} value={data.city}
                  onChange={e => { setIsDirty(true); setData(p => ({ ...p, city: e.target.value })) }}>
                  <option value="">Select</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </AppSelect>
              </div>
              <div>
                <label className={L}>Team Size</label>
                <AppSelect className={I} value={data.team_size}
                  onChange={e => { setIsDirty(true); setData(p => ({ ...p, team_size: e.target.value })) }}>
                  <option value="">Select</option>
                  {['1–10', '11–50', '51–200', '200+'].map(s => <option key={s} value={s}>{s}</option>)}
                </AppSelect>
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="bg-white rounded-[24px] p-6 space-y-5">
            <div>
              <label className={L}>Instagram URL</label>
              <input className={I} placeholder="https://instagram.com/yourbrand" value={data.instagram_url}
                onChange={e => { setIsDirty(true); setData(p => ({ ...p, instagram_url: e.target.value })) }} />
            </div>
            <div>
              <label className={L}>YouTube URL</label>
              <input className={I} placeholder="https://youtube.com/@yourbrand" value={data.youtube_url}
                onChange={e => { setIsDirty(true); setData(p => ({ ...p, youtube_url: e.target.value })) }} />
            </div>

            <div>
              <label className={L}>More social links</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {EXTRA_SOCIALS.map(({ key, label }) => (
                  <button key={key} type="button" onClick={() => toggleExtra(key)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${
                      extraOpen[key]
                        ? 'bg-[#163300] text-[#9FE870] border-[#163300]'
                        : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-3 mt-3">
                {EXTRA_SOCIALS.filter(({ key }) => extraOpen[key]).map(({ key, placeholder }) => (
                  <input key={key} className={I} placeholder={placeholder}
                    value={extraUrls[key]}
                    onChange={e => { setIsDirty(true); setExtraUrls(p => ({ ...p, [key]: e.target.value })) }}
                    autoFocus />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={save} disabled={saving}
            className="bg-[#163300] text-[#9FE870] font-bold text-[15px] py-3 px-8 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Unsaved-changes modal ──────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-[420px] shadow-2xl">
            <h3 className="text-[20px] font-black text-[#121511] mb-2">Unsaved changes</h3>
            <p className="text-[14px] text-[#6A6C6A] leading-relaxed mb-6">
              You have unsaved changes. Save them now, or leave and lose your edits.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={saveAndLeave} disabled={saving}
                className="w-full bg-[#163300] text-[#9FE870] font-bold text-[15px] py-3.5 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save & Continue'}
              </button>
              <button onClick={confirmLeave}
                className="w-full bg-[#FEF2F2] text-red-600 font-semibold text-[15px] py-3.5 rounded-full hover:bg-red-50 transition-colors">
                Discard Changes &amp; Leave
              </button>
              <button onClick={() => { setShowLeaveModal(false); setPendingNavUrl(null) }}
                className="w-full text-[14px] text-[#6A6C6A] hover:text-[#121511] transition-colors py-2">
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
