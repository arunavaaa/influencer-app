'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft, Camera, Upload, X, Loader2, Plus, Save,
} from 'lucide-react'

/* ─── Constants ─────────────────────────────────────────── */
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Bhopal', 'Other',
]
const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi',
]
const NICHES = [
  { emoji: '👗', label: 'Fashion' },
  { emoji: '💄', label: 'Beauty & Skincare' },
  { emoji: '🍜', label: 'Food & Drink' },
  { emoji: '💪', label: 'Fitness & Wellness' },
  { emoji: '💻', label: 'Tech & Gadgets' },
  { emoji: '💰', label: 'Finance' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '👨‍👩‍👧', label: 'Parenting' },
  { emoji: '😂', label: 'Comedy' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🏎️', label: 'Automotive' },
  { emoji: '🌿', label: 'Lifestyle' },
]
const PLATFORMS = ['instagram']
const FORMAT_OPTIONS: Record<string, string[]> = {
  instagram: ['reel', 'post', 'story', 'ugc'],
}
const FORMAT_LABELS: Record<string, string> = {
  reel: 'Reel',
  post: 'Post',
  story: 'Story',
  ugc: 'UGC Video',
}
const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸',
}

/* ─── Types ─────────────────────────────────────────────── */
type ProfileData = {
  id: string
  display_name: string
  profile_title: string
  bio: string
  city: string
  language: string[]
  niche: string[]
  profile_photo_url: string | null
  portfolio_urls: string[]
  audience_india_pct: number | null
  audience_gender_male_pct: number | null
  audience_age_18_24_pct: number | null
  audience_age_25_34_pct: number | null
  audience_age_35_44_pct: number | null
  audience_top_state: string | null
}

type SocialData = {
  handle_masked: string
  follower_count: number | null
  engagement_rate: number | null
}

type Package = {
  id?: string
  format: string
  platform: string
  price_inr: number | null
  delivery_days: number
  revisions_allowed: number
  description: string
  is_active: boolean
  usage_rights_months: number | null
}

type Review = {
  id: string
  rating_overall: number
  rating_communication: number | null
  rating_timeliness: number | null
  rating_satisfaction: number | null
  text: string | null
  created_at: string
  contracts: { brand_profiles: { company_name: string; logo_url: string | null } | null } | null
}

/* ─── Styles ─────────────────────────────────────────────── */
const InputStyle = 'w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'
const LabelStyle = 'block text-[12px] font-bold uppercase tracking-wider text-[#163300] mb-1.5'
const SaveBtn = 'w-full py-3.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[15px] font-black hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2'

/* ─── Page ───────────────────────────────────────────────── */
export default function ProfileEditPage() {
  const supabase = createClient()
  const router = useRouter()
  const photoRef = useRef<HTMLInputElement>(null)
  const portfolioRef = useRef<HTMLInputElement>(null)

  const [profileId, setProfileId] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [social, setSocial] = useState<SocialData>({ handle_masked: '', follower_count: null, engagement_rate: null })
  const [packages, setPackages] = useState<Package[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSocial, setSavingSocial] = useState(false)
  const [savingPackages, setSavingPackages] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: p } = await supabase
      .from('influencer_profiles')
      .select('id, display_name, profile_title, bio, city, language, niche, profile_photo_url, portfolio_urls, audience_india_pct, audience_gender_male_pct, audience_age_18_24_pct, audience_age_25_34_pct, audience_age_35_44_pct')
      .eq('user_id', user.id)
      .single()

    if (!p) { router.push('/influencer/home'); return }

    // audience_top_state requires migration 007 — fetch separately so a missing column doesn't break the page
    const { data: extraData } = await supabase
      .from('influencer_profiles')
      .select('audience_top_state')
      .eq('user_id', user.id)
      .single()

    setProfileId(p.id)
    setProfile({
      ...p,
      profile_title: p.profile_title || '',
      bio: p.bio || '',
      city: p.city || '',
      language: p.language || [],
      niche: p.niche || [],
      portfolio_urls: p.portfolio_urls || [],
      audience_india_pct: p.audience_india_pct ?? null,
      audience_gender_male_pct: p.audience_gender_male_pct ?? null,
      audience_age_18_24_pct: p.audience_age_18_24_pct ?? null,
      audience_age_25_34_pct: p.audience_age_25_34_pct ?? null,
      audience_age_35_44_pct: p.audience_age_35_44_pct ?? null,
      audience_top_state: (extraData as any)?.audience_top_state ?? null,
    })

    const { data: s } = await supabase
      .from('social_accounts')
      .select('handle_masked, follower_count, engagement_rate')
      .eq('influencer_id', p.id)
      .eq('platform', 'instagram')
      .maybeSingle()

    if (s) setSocial(s)

    const { data: pkgs } = await supabase
      .from('content_packages')
      .select('id, format, platform, price_inr, delivery_days, revisions_allowed, description, is_active, usage_rights_months')
      .eq('influencer_id', p.id)
      .order('price_inr', { ascending: true })

    if (pkgs) setPackages(pkgs.map(pkg => ({ ...pkg, description: pkg.description || '', usage_rights_months: pkg.usage_rights_months ?? null })))

    const { data: rvws } = await supabase
      .from('reviews')
      .select('id, rating_overall, rating_communication, rating_timeliness, rating_satisfaction, text, created_at, contracts(brand_profiles(company_name, logo_url))')
      .eq('influencer_id', p.id)
      .order('created_at', { ascending: false })

    if (rvws) setReviews(rvws as unknown as Review[])

    setLoading(false)
  }

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) return null
    const { url } = await res.json()
    return url
  }

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true)
    const url = await uploadFile(file, 'photos')
    if (url) {
      setProfile(p => p ? { ...p, profile_photo_url: url } : p)
      toast.success('Photo uploaded')
    } else {
      toast.error('Upload failed — please try again')
    }
    setUploadingPhoto(false)
  }

  async function handlePortfolioUpload(files: FileList) {
    setUploadingPortfolio(true)
    const newUrls: string[] = []
    const slots = 12 - (profile?.portfolio_urls.length || 0)
    for (let i = 0; i < Math.min(files.length, slots); i++) {
      const url = await uploadFile(files[i], 'content')
      if (url) newUrls.push(url)
    }
    if (newUrls.length) {
      setProfile(p => p ? { ...p, portfolio_urls: [...p.portfolio_urls, ...newUrls] } : p)
      toast.success(`${newUrls.length} file${newUrls.length > 1 ? 's' : ''} uploaded`)
    } else {
      toast.error('Upload failed — please try again')
    }
    setUploadingPortfolio(false)
  }

  async function saveProfile() {
    if (!profileId || !profile) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('influencer_profiles')
      .update({
        display_name: profile.display_name,
        profile_title: profile.profile_title || null,
        bio: profile.bio || null,
        city: profile.city || null,
        language: profile.language,
        niche: profile.niche,
        profile_photo_url: profile.profile_photo_url,
        portfolio_urls: profile.portfolio_urls,
        audience_india_pct: profile.audience_india_pct,
        audience_gender_male_pct: profile.audience_gender_male_pct,
        audience_age_18_24_pct: profile.audience_age_18_24_pct,
        audience_age_25_34_pct: profile.audience_age_25_34_pct,
        audience_age_35_44_pct: profile.audience_age_35_44_pct,
        audience_top_state: profile.audience_top_state || null,
      })
      .eq('id', profileId)

    if (error) toast.error('Failed to save — please try again')
    else toast.success('Profile saved!')
    setSavingProfile(false)
  }

  async function saveSocial() {
    if (!profileId) return
    setSavingSocial(true)
    const { error } = await supabase
      .from('social_accounts')
      .upsert({
        influencer_id: profileId,
        platform: 'instagram',
        handle_masked: social.handle_masked,
        handle_encrypted: social.handle_masked,
        follower_count: social.follower_count,
        engagement_rate: social.engagement_rate,
      }, { onConflict: 'influencer_id,platform' })

    if (error) toast.error('Failed to save — please try again')
    else toast.success('Instagram stats saved!')
    setSavingSocial(false)
  }

  async function savePackages() {
    if (!profileId) return
    setSavingPackages(true)
    let hasError = false

    for (const pkg of packages) {
      if (!pkg.price_inr || pkg.price_inr <= 0) continue

      if (pkg.id) {
        const { error } = await supabase
          .from('content_packages')
          .update({
            format: pkg.format,
            platform: pkg.platform,
            price_inr: pkg.price_inr,
            delivery_days: pkg.delivery_days,
            revisions_allowed: pkg.revisions_allowed,
            description: pkg.description || null,
            is_active: pkg.is_active,
            usage_rights_months: pkg.format === 'ugc' ? (pkg.usage_rights_months || null) : null,
          })
          .eq('id', pkg.id)
        if (error) hasError = true
      } else {
        const { error } = await supabase
          .from('content_packages')
          .insert({
            influencer_id: profileId,
            format: pkg.format,
            platform: pkg.platform,
            price_inr: pkg.price_inr,
            delivery_days: pkg.delivery_days,
            revisions_allowed: pkg.revisions_allowed,
            description: pkg.description || null,
            is_active: pkg.is_active,
            usage_rights_months: pkg.format === 'ugc' ? (pkg.usage_rights_months || null) : null,
          })
        if (error) hasError = true
      }
    }

    if (hasError) toast.error('Some packages failed to save — please try again')
    else { toast.success('Packages saved!'); fetchAll() }
    setSavingPackages(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#163300]" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-5">
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/influencer/home"
              className="flex items-center gap-1.5 text-[14px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-[#E8E8E8]">/</span>
            <p className="text-[14px] font-bold text-[#121511]">Edit Profile</p>
          </div>
          <Link
            href={`/brand/creators/${profileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold text-[#163300] hover:underline transition-colors"
          >
            Preview as brand →
          </Link>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-5 py-8 space-y-6">

        {/* ── PROFILE INFO ── */}
        <section className="bg-white rounded-[24px] p-6">
          <h2 className="text-[18px] font-black text-[#121511] mb-6">Profile</h2>

          {/* Photo */}
          <div className="flex items-center gap-5 mb-6">
            <button
              onClick={() => photoRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-[#163300]/20 bg-[#EDEFEB] flex items-center justify-center overflow-hidden relative flex-shrink-0 hover:border-[#163300] transition-colors"
            >
              {uploadingPhoto
                ? <Loader2 className="w-5 h-5 animate-spin text-[#163300]" />
                : profile.profile_photo_url
                ? <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                : <Camera className="w-6 h-6 text-[#6A6C6A]" />
              }
            </button>
            <div>
              <p className="text-[14px] font-bold text-[#121511]">Profile photo</p>
              <p className="text-[12px] text-[#6A6C6A] mb-1.5">JPG or PNG, min 200×200px</p>
              <button onClick={() => photoRef.current?.click()} className="text-[13px] font-semibold text-[#163300] hover:underline">
                {profile.profile_photo_url ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
            <input
              ref={photoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            />
          </div>

          {/* Name + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={LabelStyle}>Display Name</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={e => setProfile(p => p ? { ...p, display_name: e.target.value } : p)}
                className={InputStyle}
              />
            </div>
            <div>
              <label className={LabelStyle}>Profile Title</label>
              <input
                type="text"
                value={profile.profile_title}
                onChange={e => setProfile(p => p ? { ...p, profile_title: e.target.value } : p)}
                placeholder="e.g. Fashion Creator, Mumbai"
                className={InputStyle}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className={LabelStyle}>
              Bio <span className="font-normal normal-case tracking-normal text-[#6A6C6A]">({profile.bio.length}/300)</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => p ? { ...p, bio: e.target.value.slice(0, 300) } : p)}
              rows={3}
              placeholder="Tell brands about your content style and audience"
              className={`${InputStyle} resize-none`}
            />
          </div>

          {/* City */}
          <div className="mb-4">
            <label className={LabelStyle}>City</label>
            <select
              value={profile.city}
              onChange={e => setProfile(p => p ? { ...p, city: e.target.value } : p)}
              className={`${InputStyle} cursor-pointer`}
            >
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Languages */}
          <div className="mb-4">
            <label className={LabelStyle}>Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => {
                const selected = profile.language.includes(lang)
                return (
                  <button
                    key={lang}
                    onClick={() => setProfile(p => p ? {
                      ...p,
                      language: selected ? p.language.filter(l => l !== lang) : [...p.language, lang],
                    } : p)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${selected ? 'bg-[#9FE870] text-[#163300]' : 'bg-[#EDEFEB] text-[#6A6C6A] hover:bg-[#E0E3DD]'}`}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Niches */}
          <div className="mb-6">
            <label className={LabelStyle}>Niches</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NICHES.map(({ emoji, label }) => {
                const selected = profile.niche.includes(label)
                return (
                  <button
                    key={label}
                    onClick={() => setProfile(p => p ? {
                      ...p,
                      niche: selected ? p.niche.filter(n => n !== label) : [...p.niche, label],
                    } : p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[10px] border-2 text-[13px] font-semibold transition-all ${selected ? 'border-[#163300] bg-[#9FE870] text-[#163300]' : 'border-[#E8E8E8] text-[#6A6C6A] hover:border-[#163300]/30'}`}
                  >
                    <span>{emoji}</span>{label}
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={saveProfile} disabled={savingProfile} className={SaveBtn}>
            {savingProfile
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save profile</>}
          </button>
        </section>

        {/* ── PORTFOLIO ── */}
        <section className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[18px] font-black text-[#121511]">Portfolio</h2>
              <p className="text-[13px] text-[#6A6C6A] mt-0.5">Brands decide based on content quality — upload your best work</p>
            </div>
            <span className="text-[13px] text-[#6A6C6A]">{profile.portfolio_urls.length} / 12</span>
          </div>

          {profile.portfolio_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {profile.portfolio_urls.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-[12px] overflow-hidden bg-[#EDEFEB]">
                  {/\.(mp4|mov|webm)(\?|$)/i.test(url) ? (
                    <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => setProfile(p => p ? { ...p, portfolio_urls: p.portfolio_urls.filter((_, j) => j !== i) } : p)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {profile.portfolio_urls.length < 12 && (
            <button
              onClick={() => portfolioRef.current?.click()}
              className="w-full h-24 rounded-[12px] border-2 border-dashed border-[#163300]/20 hover:border-[#163300]/50 transition-colors flex items-center justify-center gap-3 mb-4"
            >
              {uploadingPortfolio
                ? <Loader2 className="w-5 h-5 animate-spin text-[#163300]" />
                : <><Upload className="w-5 h-5 text-[#163300]/40" /><span className="text-[14px] text-[#6A6C6A]">Add photos or videos</span></>
              }
            </button>
          )}
          <input
            ref={portfolioRef} type="file" accept="image/*,video/mp4" multiple className="hidden"
            onChange={e => e.target.files && handlePortfolioUpload(e.target.files)}
          />

          <button onClick={saveProfile} disabled={savingProfile} className={SaveBtn}>
            {savingProfile
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save portfolio</>}
          </button>
        </section>

        {/* ── INSTAGRAM STATS ── */}
        <section className="bg-white rounded-[24px] p-6">
          <h2 className="text-[18px] font-black text-[#121511] mb-1">Instagram Stats</h2>
          <p className="text-[13px] text-[#6A6C6A] mb-5">
            Enter your stats — these show on your profile for brands to see.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={LabelStyle}>Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6A6C6A]">@</span>
                <input
                  type="text"
                  value={social.handle_masked.replace('@', '')}
                  onChange={e => setSocial(s => ({ ...s, handle_masked: e.target.value }))}
                  placeholder="yourhandle"
                  className={`${InputStyle} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className={LabelStyle}>Followers</label>
              <input
                type="number"
                value={social.follower_count ?? ''}
                onChange={e => setSocial(s => ({ ...s, follower_count: e.target.value ? Number(e.target.value) : null }))}
                placeholder="e.g. 45000"
                className={InputStyle}
              />
            </div>
            <div>
              <label className={LabelStyle}>Engagement %</label>
              <input
                type="number"
                step="0.1"
                value={social.engagement_rate ?? ''}
                onChange={e => setSocial(s => ({ ...s, engagement_rate: e.target.value ? Number(e.target.value) : null }))}
                placeholder="e.g. 4.2"
                className={InputStyle}
              />
            </div>
          </div>

          <button onClick={saveSocial} disabled={savingSocial} className={SaveBtn}>
            {savingSocial
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Instagram stats</>}
          </button>
        </section>

        {/* ── AUDIENCE DEMOGRAPHICS ── */}
        <section className="bg-white rounded-[24px] p-6">
          <h2 className="text-[18px] font-black text-[#121511] mb-1">Audience Demographics</h2>
          <p className="text-[13px] text-[#6A6C6A] mb-5">
            Help brands understand who follows you. These appear on your profile and improve your chances of getting hired.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={LabelStyle}>% India-based audience</label>
              <div className="relative">
                <input
                  type="number" min={0} max={100}
                  value={profile.audience_india_pct ?? ''}
                  onChange={e => setProfile(p => p ? { ...p, audience_india_pct: e.target.value ? Number(e.target.value) : null } : p)}
                  placeholder="e.g. 92"
                  className={InputStyle}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[#6A6C6A]">%</span>
              </div>
            </div>
            <div>
              <label className={LabelStyle}>Top audience state / city</label>
              <input
                type="text"
                value={profile.audience_top_state ?? ''}
                onChange={e => setProfile(p => p ? { ...p, audience_top_state: e.target.value } : p)}
                placeholder="e.g. Tamil Nadu, Maharashtra"
                className={InputStyle}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={LabelStyle}>Gender split — % male audience</label>
            <div className="relative">
              <input
                type="number" min={0} max={100}
                value={profile.audience_gender_male_pct ?? ''}
                onChange={e => setProfile(p => p ? { ...p, audience_gender_male_pct: e.target.value ? Number(e.target.value) : null } : p)}
                placeholder="e.g. 35 (means 35% male, 65% female)"
                className={InputStyle}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-[#6A6C6A]">%</span>
            </div>
          </div>

          <div>
            <label className={LabelStyle}>Age groups</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '18–24', key: 'audience_age_18_24_pct' as const },
                { label: '25–34', key: 'audience_age_25_34_pct' as const },
                { label: '35–44', key: 'audience_age_35_44_pct' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <p className="text-[11px] text-[#6A6C6A] mb-1">{label}</p>
                  <div className="relative">
                    <input
                      type="number" min={0} max={100}
                      value={profile[key] ?? ''}
                      onChange={e => setProfile(p => p ? { ...p, [key]: e.target.value ? Number(e.target.value) : null } : p)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 rounded-[12px] border border-[#E8E8E8] bg-white text-[14px] text-[#121511] focus:outline-none focus:border-[#163300] transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6A6C6A]">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveProfile} disabled={savingProfile} className={`${SaveBtn} mt-5`}>
            {savingProfile
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save demographics</>}
          </button>
        </section>

        {/* ── PACKAGES ── */}
        <section className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[18px] font-black text-[#121511]">Packages</h2>
              <p className="text-[13px] text-[#6A6C6A] mt-0.5">What brands can order from your profile</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {packages.map((pkg, i) => (
              <PackageRow
                key={pkg.id ?? `new-${i}`}
                pkg={pkg}
                isNew={!pkg.id}
                onChange={updates => setPackages(prev => prev.map((p, j) => j === i ? { ...p, ...updates } : p))}
                onRemove={() => setPackages(prev => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>

          {packages.length === 0 && (
            <p className="text-[14px] text-[#6A6C6A] text-center py-6">No packages yet — add one below.</p>
          )}

          <button
            onClick={() => setPackages(prev => [...prev, {
              format: 'reel', platform: 'instagram', price_inr: null,
              delivery_days: 5, revisions_allowed: 2, description: '', is_active: true, usage_rights_months: null,
            }])}
            className="flex items-center gap-2 text-[14px] font-semibold text-[#163300] hover:text-[#1f4a00] mb-5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add package
          </button>

          <button onClick={savePackages} disabled={savingPackages} className={SaveBtn}>
            {savingPackages
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save packages</>}
          </button>
        </section>

        {/* Reviews */}
        <section className="bg-white rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[18px] font-black text-[#121511]">Reviews from Brands</h2>
              <p className="text-[13px] text-[#6A6C6A] mt-0.5">
                {reviews.length === 0
                  ? 'No reviews yet — they appear after completed deals.'
                  : `${reviews.length} review${reviews.length !== 1 ? 's' : ''} · avg ${(reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length).toFixed(1)} ★`
                }
              </p>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[14px] text-[#B0B2AF]">Complete your first deal to receive a review.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E8E8]">
              {reviews.map(r => {
                const brandName = r.contracts?.brand_profiles?.company_name || 'A brand'
                const logoUrl = r.contracts?.brand_profiles?.logo_url
                const date = new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                return (
                  <div key={r.id} className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EDEFEB] flex items-center justify-center text-[#163300] text-[13px] font-black flex-shrink-0 overflow-hidden">
                        {logoUrl
                          ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                          : brandName[0]?.toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[14px] font-bold text-[#121511]">{brandName}</p>
                          <p className="text-[12px] text-[#B0B2AF] flex-shrink-0">{date}</p>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-[14px] ${s <= r.rating_overall ? 'text-yellow-400' : 'text-[#E8E8E8]'}`}>★</span>
                          ))}
                          <span className="text-[12px] text-[#6A6C6A] ml-1">{r.rating_overall}/5</span>
                        </div>
                        {r.text && <p className="text-[13px] text-[#4A4C4A] leading-relaxed">{r.text}</p>}
                        {(r.rating_communication || r.rating_timeliness || r.rating_satisfaction) && (
                          <div className="flex gap-3 mt-2 flex-wrap">
                            {r.rating_communication && <span className="text-[11px] text-[#6A6C6A]">Communication {r.rating_communication}/5</span>}
                            {r.rating_timeliness && <span className="text-[11px] text-[#6A6C6A]">Timeliness {r.rating_timeliness}/5</span>}
                            {r.rating_satisfaction && <span className="text-[11px] text-[#6A6C6A]">Satisfaction {r.rating_satisfaction}/5</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

/* ─── Package Row ─────────────────────────────────────────── */
function PackageRow({
  pkg, isNew, onChange, onRemove,
}: {
  pkg: Package
  isNew: boolean
  onChange: (u: Partial<Package>) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(isNew)

  return (
    <div className={`rounded-[14px] border-2 transition-colors ${pkg.is_active ? 'border-[#E8E8E8]' : 'border-[#F0F0F0] opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-[18px] flex-shrink-0">{PLATFORM_ICONS[pkg.platform] || '📱'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[#121511]">{FORMAT_LABELS[pkg.format] || pkg.format}</p>
          <p className="text-[12px] text-[#6A6C6A]">
            {pkg.price_inr ? `₹${pkg.price_inr.toLocaleString('en-IN')}` : 'No price set'}
            {' · '}{pkg.delivery_days}d delivery · {pkg.revisions_allowed} revision{pkg.revisions_allowed !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Active toggle */}
        {!isNew && (
          <button
            onClick={() => onChange({ is_active: !pkg.is_active })}
            title={pkg.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
            className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${pkg.is_active ? 'bg-[#163300]' : 'bg-[#EDEFEB]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${pkg.is_active ? 'left-5' : 'left-0.5'}`} />
          </button>
        )}

        {isNew && (
          <button onClick={onRemove} className="text-[#B0B2AF] hover:text-red-500 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[12px] font-semibold text-[#6A6C6A] hover:text-[#163300] ml-1 flex-shrink-0"
        >
          {expanded ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Expanded edit fields */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#F0F0F0] pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">Platform</label>
              <select
                value={pkg.platform}
                onChange={e => onChange({ platform: e.target.value, format: FORMAT_OPTIONS[e.target.value]?.[0] || 'reel' })}
                className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">Format</label>
              <select
                value={pkg.format}
                onChange={e => onChange({ format: e.target.value })}
                className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
              >
                {(FORMAT_OPTIONS[pkg.platform] || ['reel']).map(f => (
                  <option key={f} value={f}>{FORMAT_LABELS[f] || f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">Price (₹)</label>
              <input
                type="number"
                value={pkg.price_inr ?? ''}
                onChange={e => onChange({ price_inr: e.target.value ? Number(e.target.value) : null })}
                placeholder="0"
                className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">Delivery days</label>
              <input
                type="number"
                value={pkg.delivery_days}
                onChange={e => onChange({ delivery_days: Math.max(1, Number(e.target.value)) })}
                min={1}
                className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">Revisions</label>
              <input
                type="number"
                value={pkg.revisions_allowed}
                onChange={e => onChange({ revisions_allowed: Math.max(0, Number(e.target.value)) })}
                min={0}
                className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">
              Description <span className="font-normal normal-case tracking-normal text-[#6A6C6A]">(optional)</span>
            </label>
            <input
              type="text"
              value={pkg.description}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="What's included? e.g. 1 Reel, 1 revision round, analytics screenshot"
              className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
            />
          </div>

          {pkg.format === 'ugc' && (
            <div className="p-3 bg-[#EDEFEB] rounded-[10px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#163300] mb-1 block">
                Usage rights — months <span className="font-normal normal-case tracking-normal text-[#6A6C6A]">(UGC only)</span>
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={pkg.usage_rights_months ?? ''}
                onChange={e => onChange({ usage_rights_months: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g. 6 (brand can use content for 6 months)"
                className="w-full px-3 py-2 rounded-[10px] border border-[#E8E8E8] text-[14px] focus:outline-none focus:border-[#163300] bg-white"
              />
              <p className="text-[11px] text-[#6A6C6A] mt-1">The brand can use this UGC in their ads for this many months. This appears in the contract.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
