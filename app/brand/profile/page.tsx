'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, Upload, Camera, Globe, Link2, Loader2, Check } from 'lucide-react'

const InputStyle =
  'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

const LabelStyle = 'block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] mb-1.5'

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Bhopal', 'Other',
]

const CATEGORIES = [
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

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–500', '500+']

interface ProfileForm {
  company_name: string
  company_description: string
  company_city: string
  logo_url: string | null
  cover_url: string | null
  website_url: string
  instagram_handle: string
  linkedin_url: string
  gst_number: string
  interested_categories: string[]
  company_size: string
}

async function uploadViaApi(file: File, folder: string): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) return null
  const { url } = await res.json()
  return url
}

export default function BrandProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const logoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileForm>({
    company_name: '',
    company_description: '',
    company_city: '',
    logo_url: null,
    cover_url: null,
    website_url: '',
    instagram_handle: '',
    linkedin_url: '',
    gst_number: '',
    interested_categories: [],
    company_size: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data } = await supabase
      .from('brand_profiles')
      .select('company_name, company_description, company_city, logo_url, cover_url, website_url, instagram_handle, linkedin_url, gst_number, interested_categories, company_size')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setForm({
        company_name: data.company_name || '',
        company_description: data.company_description || '',
        company_city: data.company_city || '',
        logo_url: data.logo_url || null,
        cover_url: data.cover_url || null,
        website_url: data.website_url || '',
        instagram_handle: data.instagram_handle || '',
        linkedin_url: data.linkedin_url || '',
        gst_number: data.gst_number || '',
        interested_categories: data.interested_categories || [],
        company_size: data.company_size || '',
      })
    }
    setLoading(false)
  }

  function patch(updates: Partial<ProfileForm>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  function toggleCategory(label: string) {
    const cur = form.interested_categories
    patch({ interested_categories: cur.includes(label) ? cur.filter(c => c !== label) : [...cur, label] })
  }

  async function handleLogo(file: File) {
    setUploading('logo')
    const url = await uploadViaApi(file, 'brand/logos')
    if (url) { patch({ logo_url: url }); toast.success('Logo uploaded!') }
    else toast.error('Upload failed — please try again')
    setUploading(null)
  }

  async function handleCover(file: File) {
    setUploading('cover')
    const url = await uploadViaApi(file, 'brand/covers')
    if (url) { patch({ cover_url: url }); toast.success('Cover photo uploaded!') }
    else toast.error('Upload failed — please try again')
    setUploading(null)
  }

  async function save() {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Session expired — please sign in again'); setSaving(false); return }

    const { error } = await supabase
      .from('brand_profiles')
      .update({
        company_name: form.company_name,
        company_description: form.company_description || null,
        company_city: form.company_city || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        website_url: form.website_url || null,
        instagram_handle: form.instagram_handle || null,
        linkedin_url: form.linkedin_url || null,
        gst_number: form.gst_number || null,
        interested_categories: form.interested_categories.length ? form.interested_categories : null,
        company_size: form.company_size || null,
      })
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      toast.error('Failed to save — please try again')
    } else {
      localStorage.removeItem('brand_nudge_dismissed')
      toast.success('Profile saved!')
      router.push('/brand/home')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[14px] font-semibold text-[#6A6C6A] hover:text-[#163300] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-[20px] font-black text-[#121511]">Brand Profile</h1>
        <button
          onClick={save}
          disabled={saving}
          className="ml-auto flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[14px] px-6 py-2.5 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-50"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-[720px] mx-auto px-5 py-10 space-y-8">

        {/* Cover + Logo */}
        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[16px] font-black text-[#121511] mb-5">Brand Identity</h2>

          {/* Cover */}
          <div className="mb-5">
            <label className={LabelStyle}>Cover Photo <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
            <button
              onClick={() => coverRef.current?.click()}
              disabled={!!uploading}
              className="w-full h-[140px] rounded-2xl border-2 border-dashed border-[#163300]/20 hover:border-[#163300]/50 transition-colors overflow-hidden relative group"
            >
              {form.cover_url ? (
                <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#9FE870]/20 to-[#163300]/10 flex flex-col items-center justify-center gap-2">
                  {uploading === 'cover'
                    ? <Loader2 className="w-6 h-6 animate-spin text-[#163300]" />
                    : <><Upload className="w-6 h-6 text-[#163300]/40" /><span className="text-[13px] text-[#6A6C6A]">Upload cover photo</span></>
                  }
                </div>
              )}
              {form.cover_url && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[13px] font-semibold">Change cover</span>
                </div>
              )}
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleCover(e.target.files[0])} />
          </div>

          {/* Logo + Company name */}
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0">
              <button
                onClick={() => logoRef.current?.click()}
                disabled={!!uploading}
                className="w-[80px] h-[80px] rounded-2xl border-2 border-dashed border-[#163300]/20 hover:border-[#163300]/50 transition-colors overflow-hidden relative group"
              >
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#EDEFEB] flex flex-col items-center justify-center gap-1">
                    {uploading === 'logo'
                      ? <Loader2 className="w-5 h-5 animate-spin text-[#163300]" />
                      : <><Camera className="w-5 h-5 text-[#163300]/40" /><span className="text-[9px] text-[#6A6C6A]">Logo</span></>
                    }
                  </div>
                )}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleLogo(e.target.files[0])} />
            </div>
            <div className="flex-1">
              <label className={LabelStyle}>Company Name *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => patch({ company_name: e.target.value })}
                placeholder="e.g. Mamaearth"
                className={InputStyle}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={LabelStyle}>About your brand <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
            <textarea
              value={form.company_description}
              onChange={e => patch({ company_description: e.target.value })}
              placeholder="Tell creators what your brand is about and the kind of collaborations you're looking for..."
              rows={3}
              maxLength={400}
              className={`${InputStyle} resize-none`}
            />
            <p className="text-[12px] text-[#6A6C6A] mt-1 text-right">{form.company_description.length}/400</p>
          </div>
        </div>

        {/* Online Presence */}
        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[16px] font-black text-[#121511] mb-5">Online Presence</h2>
          <div className="space-y-4">
            <div>
              <label className={LabelStyle}>Website URL</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
                <input type="url" value={form.website_url} onChange={e => patch({ website_url: e.target.value })}
                  placeholder="https://yoursite.com" className={`${InputStyle} pl-11`} />
              </div>
            </div>
            <div>
              <label className={LabelStyle}>Instagram Handle <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6A6C6A]">@</span>
                <input type="text" value={form.instagram_handle}
                  onChange={e => patch({ instagram_handle: e.target.value.replace('@', '') })}
                  placeholder="yourbrand" className={`${InputStyle} pl-9`} />
              </div>
            </div>
            <div>
              <label className={LabelStyle}>LinkedIn URL <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6C6A]" />
                <input type="url" value={form.linkedin_url} onChange={e => patch({ linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/yourbrand" className={`${InputStyle} pl-11`} />
              </div>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[16px] font-black text-[#121511] mb-5">Business Details</h2>
          <div className="space-y-5">
            <div>
              <label className={LabelStyle}>Company Location <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
              <select value={form.company_city} onChange={e => patch({ company_city: e.target.value })} className={InputStyle}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={LabelStyle}>Team Size <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {TEAM_SIZES.map(size => (
                  <button key={size} onClick={() => patch({ company_size: size })}
                    className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all border-2 ${
                      form.company_size === size
                        ? 'bg-[#9FE870] border-[#163300] text-[#163300]'
                        : 'bg-[#EDEFEB] border-transparent text-[#6A6C6A] hover:border-[#163300]/30'
                    }`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LabelStyle}>GST Number <span className="font-normal normal-case tracking-normal text-[10px] text-[#6A6C6A]">(optional)</span></label>
              <input type="text" value={form.gst_number} onChange={e => patch({ gst_number: e.target.value })}
                placeholder="e.g. 22AAAAA0000A1Z5" className={InputStyle} />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[16px] font-black text-[#121511] mb-2">Content Categories</h2>
          <p className="text-[13px] text-[#6A6C6A] mb-5">Select the niches that match your brand.</p>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(({ emoji, label }) => {
              const selected = form.interested_categories.includes(label)
              return (
                <button key={label} onClick={() => toggleCategory(label)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5 ${
                    selected
                      ? 'border-[#163300] bg-[#163300] text-white'
                      : 'border-[#EDEFEB] bg-[#EDEFEB] text-[#121511] hover:border-[#163300]/30'
                  }`}>
                  <span className="text-[24px] leading-none">{emoji}</span>
                  <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
                  {selected && (
                    <div className="w-4 h-4 bg-[#9FE870] rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-[#163300]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#9FE870] text-[#163300] font-bold text-[16px] py-4 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
