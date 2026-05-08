'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = ['Fashion', 'Food & Beverage', 'Tech', 'Finance', 'Health & Fitness', 'Travel', 'Beauty & Skincare', 'Gaming', 'Education', 'Home & Lifestyle', 'Automobile', 'E-commerce']

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
  })

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('brand_profiles')
      .update({
        company_name: form.company_name,
        website_url: form.website_url,
        gst_number: form.gst_number,
        category: form.category,
      })
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    router.push('/brand/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {/* Step 1 — Company info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your brand</CardTitle>
              <CardDescription>This helps influencers know who they're working with</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Company name</Label>
                <Input
                  placeholder="e.g. Mamaearth"
                  value={form.company_name}
                  onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Website URL</Label>
                <Input
                  placeholder="e.g. https://mamaearth.in"
                  value={form.website_url}
                  onChange={e => setForm(prev => ({ ...prev, website_url: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>GST Number <span className="text-muted-foreground text-xs">(optional for now)</span></Label>
                <Input
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={form.gst_number}
                  onChange={e => setForm(prev => ({ ...prev, gst_number: e.target.value }))}
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => setStep(2)}
                disabled={!form.company_name || !form.website_url}
              >
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Category */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>What industry are you in?</CardTitle>
              <CardDescription>We'll use this to suggest the right influencers</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <Badge
                    key={cat}
                    variant={form.category === cat ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!form.category || loading}
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}