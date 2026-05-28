'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Trash2, Camera } from 'lucide-react'
import { NICHES, NICHE_EMOJIS, CITIES, LANGUAGES, FOLLOWER_RANGES } from '@/lib/types'
import { AppSelect } from '@/components/ui/app-select'
import Link from 'next/link'

const L = 'block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5'
const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const PACKAGE_PLATFORMS = ['Instagram', 'YouTube', 'X', 'Facebook']

const CONTENT_TYPES_BY_PLATFORM: Record<string, string[]> = {
  Instagram: ['Reel', 'Story', 'Post'],
  YouTube:   ['Long form video', 'Shorts'],
  Facebook:  ['Reel', 'Post'],
  X:         ['Tweet (photo)', 'Tweet (video)', 'Thread'],
}

export default function ProfileEdit() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [creatorId, setCreatorId]   = useState<string | null>(null)
  const [userId, setUserId]         = useState<string | null>(null)
  const [username, setUsername]     = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar]   = useState(false)

  const [profile, setProfile] = useState({
    display_name: '', city: '', bio: '',
    languages: [] as string[],
    niches: [] as string[],
    instagram_url: '', instagram_followers: '',
    youtube_url: '', youtube_subscribers: '',
  })

  const [otherNiche, setOtherNiche]         = useState('')
  const [xUrl, setXUrl]                     = useState('')
  const [xFollowers, setXFollowers]         = useState('')
  const [facebookUrl, setFacebookUrl]       = useState('')
  const [facebookFollowers, setFacebookFollowers] = useState('')
  const [socialsOpen, setSocialsOpen]       = useState({ x: false, facebook: false })
  const [packages, setPackages]             = useState<any[]>([])

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
      // External links open in new tab — let them through
      if (anchor.target === '_blank') return
      // Same page — let through
      const destPath = href.split('?')[0]
      if (destPath === window.location.pathname) return
      e.preventDefault()
      e.stopPropagation()
      setPendingNavUrl(href)
      setShowLeaveModal(true)
    }
    document.addEventListener('click', handleClick, true) // capture = fires before Link handler

    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [isDirty])

  // Load profile data
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data: c } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (c) {
        setCreatorId(c.id)
        setUsername(c.username)
        if (c.profile_photo_url) setAvatarPreview(c.profile_photo_url)

        // Detect custom "Other" niche — onboarding saves the typed value in place of "Other"
        const standardNiches = new Set(NICHES)
        const customVal = (c.niches as string[] ?? []).find((n: string) => !standardNiches.has(n))
        const loadedNiches: string[] = customVal
          ? (c.niches as string[]).map((n: string) => n === customVal ? 'Other' : n)
          : (c.niches ?? [])
        if (customVal) setOtherNiche(customVal)

        setProfile({
          display_name:        c.display_name ?? '',
          city:                c.city ?? '',
          bio:                 c.bio ?? '',
          languages:           c.languages ?? [],
          niches:              loadedNiches,
          instagram_url:       c.instagram_url ?? '',
          instagram_followers: c.instagram_followers != null ? String(c.instagram_followers) : '',
          youtube_url:         c.youtube_url ?? '',
          youtube_subscribers: c.youtube_subscribers != null ? String(c.youtube_subscribers) : '',
        })

        const links = c.other_social_links ?? {}
        setXUrl(links.x_url ?? '')
        setXFollowers(links.x_followers ?? '')
        setFacebookUrl(links.facebook_url ?? '')
        setFacebookFollowers(links.facebook_followers ?? '')
        setSocialsOpen({
          x:        !!(links.x_url || links.x_followers),
          facebook: !!(links.facebook_url || links.facebook_followers),
        })
      }
      const { data: pkgs } = await supabase.from('content_packages').select('*').eq('creator_id', c?.id ?? '').order('created_at')
      setPackages(pkgs ?? [])
      setLoading(false)
    })
  }, [])

  // Toggle niche — enforces minimum of 1
  function toggleArr<K extends 'languages' | 'niches'>(k: K, v: string) {
    if (k === 'niches') {
      const cur = profile.niches
      if (cur.includes(v) && cur.length === 1) { toast.error('At least one niche must be selected'); return }
      if (v === 'Other' && cur.includes('Other')) setOtherNiche('')
    }
    setIsDirty(true)
    setProfile(p => ({
      ...p,
      [k]: (p[k] as string[]).includes(v)
        ? (p[k] as string[]).filter(x => x !== v)
        : [...(p[k] as string[]), v],
    }))
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('JPG or PNG only.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB.'); return }
    const previewUrl = URL.createObjectURL(file)
    const img = new window.Image()
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = previewUrl })
    if (img.width < 200 || img.height < 200) { URL.revokeObjectURL(previewUrl); toast.error(`Min 200×200px (yours: ${img.width}×${img.height}px).`); return }
    setIsDirty(true)
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
  }

  function toggleSocial(key: 'x' | 'facebook') {
    setIsDirty(true)
    if (socialsOpen[key]) {
      if (key === 'x')        { setXUrl(''); setXFollowers('') }
      if (key === 'facebook') { setFacebookUrl(''); setFacebookFollowers('') }
    }
    setSocialsOpen(v => ({ ...v, [key]: !v[key] }))
  }

  async function save(): Promise<boolean> {
    if (!creatorId) return false
    if (profile.niches.length === 0)                                       { toast.error('Select at least one niche'); return false }
    if (profile.niches.includes('Other') && !otherNiche.trim())            { toast.error('Describe your "Other" niche'); return false }
    if (profile.instagram_url && !profile.instagram_followers)             { toast.error('Select your Instagram follower range'); return false }
    if (profile.instagram_followers && !profile.instagram_url)             { toast.error('Add your Instagram profile link'); return false }
    if (profile.youtube_url && !profile.youtube_subscribers)               { toast.error('Select your YouTube subscriber range'); return false }
    if (profile.youtube_subscribers && !profile.youtube_url)               { toast.error('Add your YouTube channel link'); return false }
    if (socialsOpen.x && xUrl && !xFollowers)                              { toast.error('Select your X follower range'); return false }
    if (socialsOpen.x && xFollowers && !xUrl)                              { toast.error('Add your X profile link'); return false }
    if (socialsOpen.facebook && facebookUrl && !facebookFollowers)         { toast.error('Select your Facebook follower range'); return false }
    if (socialsOpen.facebook && facebookFollowers && !facebookUrl)         { toast.error('Add your Facebook profile link'); return false }
    setSaving(true)

    // Avatar
    let profile_photo_url: string | null | undefined
    if (removeAvatar) {
      profile_photo_url = null
    } else if (avatarFile && userId) {
      const ext = avatarFile.name.split('.').pop()
      const { error: upErr } = await supabase.storage.from('creator-avatars').upload(`${userId}/avatar.${ext}`, avatarFile, { upsert: true })
      if (upErr) { toast.error('Photo upload failed — rest of profile saved.') }
      else {
        const { data: { publicUrl } } = supabase.storage.from('creator-avatars').getPublicUrl(`${userId}/avatar.${ext}`)
        profile_photo_url = publicUrl
        setAvatarFile(null)
      }
    }

    const links: Record<string, string> = {}
    if (xUrl.trim())          links.x_url             = xUrl.trim()
    if (xFollowers)           links.x_followers        = xFollowers
    if (facebookUrl.trim())   links.facebook_url       = facebookUrl.trim()
    if (facebookFollowers)    links.facebook_followers = facebookFollowers
    // Replace "Other" with the typed custom niche value (same logic as onboarding)
    const finalNiches = profile.niches.map(n => n === 'Other' && otherNiche.trim() ? otherNiche.trim() : n)

    const { error } = await supabase.from('creator_profiles').update({
      display_name:        profile.display_name || null,
      city:                profile.city || null,
      bio:                 profile.bio || null,
      languages:           profile.languages.length ? profile.languages : null,
      niches:              finalNiches.length ? finalNiches : null,
      instagram_url:       profile.instagram_url || null,
      instagram_followers: profile.instagram_followers !== '' ? parseInt(profile.instagram_followers) : null,
      youtube_url:         profile.youtube_url || null,
      youtube_subscribers: profile.youtube_subscribers !== '' ? parseInt(profile.youtube_subscribers) : null,
      other_social_links:  Object.keys(links).length ? links : null,
      ...(profile_photo_url !== undefined ? { profile_photo_url } : {}),
      updated_at:          new Date().toISOString(),
    }).eq('id', creatorId)

    setSaving(false)
    if (error) { toast.error('Failed to save'); return false }
    toast.success('Profile saved!')
    setRemoveAvatar(false)
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

  async function addPackage() {
    if (!creatorId) return
    const { data } = await supabase.from('content_packages').insert({
      creator_id: creatorId, platform: 'Instagram', content_type: '',
      price_inr: 0, delivery_days: 7, revisions: 2, is_active: true,
    }).select().single()
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
    <>
      <div className="p-6 md:p-8 max-w-[720px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-black text-[#121511]">Edit Profile</h1>
          {username && <Link href={`/${username}`} target="_blank" className="text-[13px] font-semibold text-[#163300] hover:underline">View Profile →</Link>}
        </div>

        <div className="space-y-6">

          {/* ── Profile basics ─────────────────────────────────── */}
          <div className="bg-white rounded-[24px] p-6 space-y-5">

            {/* Profile photo */}
            <div className="flex flex-col items-center pb-2">
              <input id="avatar-upload" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
              <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                <div className="w-20 h-20 rounded-full bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[28px] overflow-hidden">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                    : <span>{profile.display_name?.[0]?.toUpperCase() || '?'}</span>}
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#163300] rounded-full flex items-center justify-center border-2 border-white">
                  <Camera className="w-3 h-3 text-[#9FE870]" />
                </div>
              </label>
              <p className="text-[12px] text-[#6A6C6A] mt-2">
                {avatarFile ? 'Photo ready — save to upload ✓' : avatarPreview ? 'Click to change photo' : 'Upload profile photo'}
              </p>
              <p className="text-[11px] text-[#9A9C9A] mt-0.5">Min 200×200px · JPG or PNG · Max 2 MB</p>
              {avatarPreview && (
                <button type="button"
                  onClick={() => { setIsDirty(true); setAvatarPreview(null); setAvatarFile(null); setRemoveAvatar(true) }}
                  className="mt-1.5 text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                  Remove photo
                </button>
              )}
            </div>

            <div>
              <label className={L}>Display Name</label>
              <input className={I} value={profile.display_name}
                onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, display_name: e.target.value })) }} />
            </div>

            <div>
              <label className={L}>City</label>
              <AppSelect className={I} value={profile.city}
                onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, city: e.target.value })) }}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </AppSelect>
            </div>

            <div>
              <label className={L}>Bio</label>
              <textarea className={`${I} resize-none`} rows={3} maxLength={300} value={profile.bio}
                onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, bio: e.target.value })) }} />
              <p className="text-[12px] text-[#9A9C9A] mt-1 text-right">{profile.bio.length}/300</p>
            </div>

            <div>
              <label className={L}>Languages</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => toggleArr('languages', l)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 transition-all ${profile.languages.includes(l) ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={L}>Niches</label>
              <p className="text-[12px] text-[#9A9C9A] mb-2">Select all that apply. At least one required.</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {NICHES.map(n => (
                  <button key={n} onClick={() => toggleArr('niches', n)}
                    className={`p-2 rounded-[12px] border-2 text-center transition-all ${profile.niches.includes(n) ? 'border-[#163300] bg-[#163300]/5' : 'border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                    <div className="text-[16px]">{NICHE_EMOJIS[n]}</div>
                    <p className="text-[10px] font-semibold text-[#121511] leading-tight">{n}</p>
                  </button>
                ))}
              </div>
              {profile.niches.includes('Other') && (
                <input className={`${I} mt-3`} placeholder="Describe your niche (e.g. Crypto, Astrology...)"
                  value={otherNiche}
                  onChange={e => { setIsDirty(true); setOtherNiche(e.target.value) }}
                  autoFocus />
              )}
            </div>
          </div>

          {/* ── Social Links ───────────────────────────────────── */}
          <div className="bg-white rounded-[24px] p-6 space-y-5">
            <h3 className="text-[16px] font-black text-[#121511]">Social Links</h3>

            <div>
              <label className={L}>Instagram</label>
              <div className="grid grid-cols-2 gap-3">
                <input className={I} placeholder="https://instagram.com/you" value={profile.instagram_url}
                  onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, instagram_url: e.target.value })) }} />
                <AppSelect className={I} value={profile.instagram_followers}
                  onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, instagram_followers: e.target.value })) }}>
                  <option value="">Followers</option>
                  {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                </AppSelect>
              </div>
            </div>

            <div>
              <label className={L}>YouTube</label>
              <div className="grid grid-cols-2 gap-3">
                <input className={I} placeholder="https://youtube.com/@you" value={profile.youtube_url}
                  onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, youtube_url: e.target.value })) }} />
                <AppSelect className={I} value={profile.youtube_subscribers}
                  onChange={e => { setIsDirty(true); setProfile(p => ({ ...p, youtube_subscribers: e.target.value })) }}>
                  <option value="">Subscribers</option>
                  {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                </AppSelect>
              </div>
            </div>

            <div>
              <label className={L}>More Social Links</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {([['x', 'X (Twitter)'], ['facebook', 'Facebook']] as const).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => toggleSocial(key)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all ${socialsOpen[key] ? 'bg-[#163300] text-[#9FE870] border-[#163300]' : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {socialsOpen.x && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input className={I} placeholder="https://x.com/you" value={xUrl}
                    onChange={e => { setIsDirty(true); setXUrl(e.target.value) }} />
                  <AppSelect className={I} value={xFollowers}
                    onChange={e => { setIsDirty(true); setXFollowers(e.target.value) }}>
                    <option value="">Followers</option>
                    {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                  </AppSelect>
                </div>
              )}

              {socialsOpen.facebook && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input className={I} placeholder="https://facebook.com/you" value={facebookUrl}
                    onChange={e => { setIsDirty(true); setFacebookUrl(e.target.value) }} />
                  <AppSelect className={I} value={facebookFollowers}
                    onChange={e => { setIsDirty(true); setFacebookFollowers(e.target.value) }}>
                    <option value="">Followers</option>
                    {FOLLOWER_RANGES.map(r => <option key={r.value} value={String(r.min)}>{r.label}</option>)}
                  </AppSelect>
                </div>
              )}

            </div>
          </div>

          {/* ── Content Packages ───────────────────────────────── */}
          <div className="bg-white rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-black text-[#121511]">Content Packages</h3>
              <button onClick={addPackage} className="text-[13px] font-bold text-[#163300] hover:underline">+ Add Package</button>
            </div>
            {packages.length === 0 && (
              <p className="text-[14px] text-[#6A6C6A]">No packages yet. Add one to show brands what you offer.</p>
            )}
            <div className="space-y-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="border border-[#E8E8E8] rounded-[16px] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <div>
                        <label className={`${L} text-[9px]`}>Platform</label>
                        <AppSelect className={`${I} text-[13px] py-2`} value={pkg.platform}
                          onChange={e => {
                            const newPlatform = e.target.value
                            updatePackage(pkg.id, 'platform', newPlatform)
                            updatePackage(pkg.id, 'content_type', '')
                          }}>
                          <option value="">Select platform</option>
                          {PACKAGE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </AppSelect>
                      </div>
                      <div>
                        <label className={`${L} text-[9px]`}>Content Type</label>
                        <AppSelect className={`${I} text-[13px] py-2`} value={pkg.content_type}
                          disabled={!pkg.platform}
                          onChange={e => updatePackage(pkg.id, 'content_type', e.target.value)}>
                          <option value="">Select type</option>
                          {(CONTENT_TYPES_BY_PLATFORM[pkg.platform] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                        </AppSelect>
                      </div>
                    </div>
                    <button onClick={() => deletePackage(pkg.id)} className="ml-3 mt-5 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={`${L} text-[9px]`}>Price (₹)</label>
                      <input type="number" className={`${I} text-[13px] py-2`} value={pkg.price_inr || ''}
                        onChange={e => updatePackage(pkg.id, 'price_inr', parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className={`${L} text-[9px]`}>Delivery Days</label>
                      <input type="number" className={`${I} text-[13px] py-2`} value={pkg.delivery_days}
                        onChange={e => updatePackage(pkg.id, 'delivery_days', parseInt(e.target.value) || 1)} />
                    </div>
                    <div>
                      <label className={`${L} text-[9px]`}>Revisions</label>
                      <input type="number" className={`${I} text-[13px] py-2`} value={pkg.revisions}
                        onChange={e => updatePackage(pkg.id, 'revisions', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              ))}
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
