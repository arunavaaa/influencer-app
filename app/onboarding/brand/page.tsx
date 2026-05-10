'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

const TOTAL_STEPS = 5

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2 mb-10">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < step ? 'bg-[#9FE870]' : i === step - 1 ? 'bg-[#163300]' : 'bg-[#E8E8E8]'
          }`}
        />
      ))}
    </div>
  )
}

function OptionCard({
  label,
  selected,
  onClick,
  description,
}: {
  label: string
  selected: boolean
  onClick: () => void
  description?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-[16px] border-2 transition-colors flex items-center justify-between ${
        selected
          ? 'border-[#163300] bg-[#163300] text-white'
          : 'border-[#E8E8E8] bg-white text-[#121511] hover:border-[#163300]'
      }`}
    >
      <div>
        <p className="text-[16px] font-bold">{label}</p>
        {description && (
          <p className={`text-[13px] mt-0.5 ${selected ? 'text-white/60' : 'text-[#6A6C6A]'}`}>
            {description}
          </p>
        )}
      </div>
      {selected && (
        <div className="w-6 h-6 bg-[#9FE870] rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-[#163300]" />
        </div>
      )}
    </button>
  )
}

function MultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`text-[14px] font-semibold px-4 py-2 rounded-full border-2 transition-colors ${
            selected.includes(opt)
              ? 'border-[#163300] bg-[#163300] text-[#9FE870]'
              : 'border-[#E8E8E8] bg-white text-[#121511] hover:border-[#163300]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function BrandOnboarding() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    website_url: '',
    gst_number: '',
    category: '',
    onboarding_goal: '',
    business_type: '',
    preferred_platforms: [] as string[],
    company_size: '',
    monthly_budget: '',
  })

  function set(key: string, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function togglePlatform(p: string) {
    const cur = form.preferred_platforms
    set('preferred_platforms', cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  }

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error } = await supabase
      .from('brand_profiles')
      .update({
        company_name: form.company_name,
        website_url: form.website_url,
        gst_number: form.gst_number || null,
        category: form.category,
        onboarding_goal: form.onboarding_goal,
        business_type: form.business_type,
        preferred_platforms: form.preferred_platforms,
        company_size: form.company_size,
        monthly_budget: form.monthly_budget,
      })
      .eq('user_id', user.id)

    if (error) {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    toast.success('Profile complete!')
    router.push('/brand/home')
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[24px] font-black text-[#163300]">Crayon</p>
          <p className="text-[14px] text-[#6A6C6A] mt-1">
            Step {step} of {TOTAL_STEPS} — Brand Setup
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-8">
          <ProgressBar step={step} />

          {/* ── STEP 1: Company info ── */}
          {step === 1 && (
            <div>
              <h2 className="text-[25px] font-black text-[#121511] mb-1">Tell us about your brand</h2>
              <p className="text-[15px] text-[#6A6C6A] mb-6">
                This is shown to influencers when they review your campaigns.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[13px] font-bold text-[#121511] mb-1.5 block">Company Name *</label>
                  <input
                    placeholder="e.g. Mamaearth"
                    value={form.company_name}
                    onChange={(e) => set('company_name', e.target.value)}
                    className="w-full text-[15px] px-4 py-3 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-[#121511] mb-1.5 block">Website URL *</label>
                  <input
                    placeholder="https://yoursite.com"
                    value={form.website_url}
                    onChange={(e) => set('website_url', e.target.value)}
                    className="w-full text-[15px] px-4 py-3 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300]"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-bold text-[#121511] mb-1.5 block">
                    GST Number <span className="font-normal text-[#6A6C6A]">(optional)</span>
                  </label>
                  <input
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={form.gst_number}
                    onChange={(e) => set('gst_number', e.target.value)}
                    className="w-full text-[15px] px-4 py-3 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Goal ── */}
          {step === 2 && (
            <div>
              <h2 className="text-[25px] font-black text-[#121511] mb-1">What&apos;s your goal?</h2>
              <p className="text-[15px] text-[#6A6C6A] mb-6">
                We&apos;ll personalise your experience based on this.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { val: 'content', label: 'Get content for my brand', desc: 'UGC, product photos, videos for ads' },
                  { val: 'campaign', label: 'Run an influencer campaign', desc: 'Influencers post to their audience' },
                  { val: 'explore', label: 'Just exploring', desc: 'Browsing to see what\'s available' },
                ].map(({ val, label, desc }) => (
                  <OptionCard
                    key={val}
                    label={label}
                    description={desc}
                    selected={form.onboarding_goal === val}
                    onClick={() => set('onboarding_goal', val)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Business type ── */}
          {step === 3 && (
            <div>
              <h2 className="text-[25px] font-black text-[#121511] mb-1">What kind of business?</h2>
              <p className="text-[15px] text-[#6A6C6A] mb-6">
                Helps us suggest the right creator tiers for you.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { val: 'ecommerce', label: 'E-commerce / D2C' },
                  { val: 'saas', label: 'SaaS / App' },
                  { val: 'agency', label: 'Agency' },
                  { val: 'local', label: 'Local Business' },
                  { val: 'other', label: 'Other' },
                ].map(({ val, label }) => (
                  <OptionCard
                    key={val}
                    label={label}
                    selected={form.business_type === val}
                    onClick={() => set('business_type', val)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Platforms ── */}
          {step === 4 && (
            <div>
              <h2 className="text-[25px] font-black text-[#121511] mb-1">Which platforms?</h2>
              <p className="text-[15px] text-[#6A6C6A] mb-6">
                Select all platforms you want to run campaigns on.
              </p>
              <MultiSelect
                options={['Instagram', 'YouTube', 'Moj', 'ShareChat']}
                selected={form.preferred_platforms}
                onToggle={togglePlatform}
              />

              <div className="mt-8">
                <h3 className="text-[16px] font-bold text-[#121511] mb-4">Team size</h3>
                <div className="flex flex-wrap gap-2">
                  {['Just me', '2–10', '11–50', '51–500', '500+'].map((size) => (
                    <button
                      key={size}
                      onClick={() => set('company_size', size)}
                      className={`text-[14px] font-semibold px-4 py-2 rounded-full border-2 transition-colors ${
                        form.company_size === size
                          ? 'border-[#163300] bg-[#163300] text-[#9FE870]'
                          : 'border-[#E8E8E8] bg-white text-[#121511] hover:border-[#163300]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Budget ── */}
          {step === 5 && (
            <div>
              <h2 className="text-[25px] font-black text-[#121511] mb-1">Monthly influencer budget?</h2>
              <p className="text-[15px] text-[#6A6C6A] mb-6">
                We&apos;ll show you creator tiers that fit your budget.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { val: 'under_10k', label: 'Under ₹10,000' },
                  { val: '10k_50k', label: '₹10,000 – ₹50,000' },
                  { val: '50k_2l', label: '₹50,000 – ₹2,00,000' },
                  { val: '2l_5l', label: '₹2,00,000 – ₹5,00,000' },
                  { val: 'above_5l', label: '₹5,00,000+' },
                ].map(({ val, label }) => (
                  <OptionCard
                    key={val}
                    label={label}
                    selected={form.monthly_budget === val}
                    onClick={() => set('monthly_budget', val)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 border-2 border-[#E8E8E8] text-[#6A6C6A] font-bold text-[15px] py-3.5 rounded-full hover:border-[#163300] transition-colors"
              >
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!form.company_name || !form.website_url)) ||
                  (step === 2 && !form.onboarding_goal) ||
                  (step === 3 && !form.business_type)
                }
                className="flex-1 bg-[#163300] text-[#9FE870] font-bold text-[15px] py-3.5 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!form.monthly_budget || loading}
                className="flex-1 bg-[#9FE870] text-[#163300] font-bold text-[15px] py-3.5 rounded-full hover:bg-[#8fdc60] transition-colors disabled:opacity-40"
              >
                {loading ? 'Setting up...' : 'Complete Setup →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
