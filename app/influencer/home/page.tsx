'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

type Package = {
  id: string
  format: string
  platform: string
  price_inr: number
  delivery_days: number
  revisions_allowed: number
  description: string
}

export default function InfluencerHome() {
  const supabase = createClient()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    format: '',
    platform: '',
    price_inr: '',
    delivery_days: '',
    revisions_allowed: '2',
    description: '',
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const { data } = await supabase
      .from('content_packages')
      .select('*')
      .eq('influencer_id', profile.id)
      .eq('is_active', true)

    setPackages(data || [])
    setLoading(false)
  }

  async function savePackage() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const { error } = await supabase
      .from('content_packages')
      .insert({
        influencer_id: profile.id,
        format: form.format,
        platform: form.platform,
        price_inr: parseInt(form.price_inr),
        delivery_days: parseInt(form.delivery_days),
        revisions_allowed: parseInt(form.revisions_allowed),
        description: form.description,
      })

    if (!error) {
      setForm({ format: '', platform: '', price_inr: '', delivery_days: '', revisions_allowed: '2', description: '' })
      setAdding(false)
      fetchPackages()
    }

    setSaving(false)
  }

  async function deletePackage(id: string) {
    await supabase
      .from('content_packages')
      .update({ is_active: false })
      .eq('id', id)
    fetchPackages()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your packages and incoming deals</p>
      </div>

      <div className="px-8 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">My Packages</h2>
            <p className="text-sm text-muted-foreground">Set your content offerings — brands will see these on your profile</p>
          </div>
          <Button onClick={() => setAdding(true)} disabled={adding}>
            + Add Package
          </Button>
        </div>

        {/* Add package form */}
        {adding && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Package</CardTitle>
              <CardDescription>Define what you're offering and how much it costs</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Platform</Label>
                  <Select onValueChange={v => setForm(p => ({ ...p, platform: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="moj">Moj</SelectItem>
                      <SelectItem value="sharechat">ShareChat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Format</Label>
                  <Select onValueChange={v => setForm(p => ({ ...p, format: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="ugc">UGC</SelectItem>
                      <SelectItem value="youtube_video">YouTube Video</SelectItem>
                      <SelectItem value="youtube_short">YouTube Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 8000"
                    value={form.price_inr}
                    onChange={e => setForm(p => ({ ...p, price_inr: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Delivery (days)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 3"
                    value={form.delivery_days}
                    onChange={e => setForm(p => ({ ...p, delivery_days: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Revisions</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2"
                    value={form.revisions_allowed}
                    onChange={e => setForm(p => ({ ...p, revisions_allowed: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="e.g. 60-second reel with product showcase and CTA"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={savePackage}
                  disabled={!form.platform || !form.format || !form.price_inr || !form.delivery_days || saving}
                >
                  {saving ? 'Saving...' : 'Save Package'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Packages list */}
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : packages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No packages yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first package so brands can hire you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {packages.map(pkg => (
              <Card key={pkg.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{pkg.platform}</Badge>
                        <Badge variant="outline">{pkg.format}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pkg.delivery_days} day delivery · {pkg.revisions_allowed} revisions
                      </p>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{pkg.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold">₹{pkg.price_inr.toLocaleString('en-IN')}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deletePackage(pkg.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}