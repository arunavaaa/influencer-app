'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const NICHES = ['Fashion', 'Food', 'Tech', 'Finance', 'Fitness', 'Travel', 'Beauty', 'Gaming', 'Parenting', 'Education', 'Lifestyle', 'Comedy']
const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati']

export default function InfluencerOnboarding() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    city: '',
    niche: [] as string[],
    language: [] as string[],
  })

  function toggleItem(field: 'niche' | 'language', item: string) {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('influencer_profiles')
      .update({
        display_name: form.display_name,
        bio: form.bio,
        city: form.city,
        niche: form.niche,
        language: form.language,
        is_profile_live: true,
      })
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>This is what brands will see on your profile</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Display name</Label>
                <Input
                  placeholder="e.g. Priya Sharma"
                  value={form.display_name}
                  onChange={e => setForm(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>City</Label>
                <Input
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell brands what you do and what makes you unique..."
                  value={form.bio}
                  onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => setStep(2)}
                disabled={!form.display_name || !form.city}
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Niches */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>What's your niche?</CardTitle>
              <CardDescription>Select all that apply — brands filter by these</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {NICHES.map(niche => (
                  <Badge
                    key={niche}
                    variant={form.niche.includes(niche) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleItem('niche', niche)}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={form.niche.length === 0}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Languages */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Which languages do you create in?</CardTitle>
              <CardDescription>Helps brands find creators for regional campaigns</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <Badge
                    key={lang}
                    variant={form.language.includes(lang) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleItem('language', lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={form.language.length === 0 || loading}
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}