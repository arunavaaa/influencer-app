'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SelectRolePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function selectRole(role: 'influencer' | 'brand') {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        role: role,
      })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    if (role === 'influencer') {
      await supabase
        .from('influencer_profiles')
        .upsert({ user_id: user.id })

      router.push('/onboarding/influencer')
    } else {
      await supabase
        .from('brand_profiles')
        .upsert({ user_id: user.id })

      router.push('/onboarding/brand')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome! Who are you?</h1>
          <p className="text-muted-foreground mt-2">
            Choose your account type to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => !loading && selectRole('influencer')}
          >
            <CardHeader>
              <div className="text-4xl mb-2">🎥</div>
              <CardTitle>I'm an Influencer</CardTitle>
              <CardDescription>
                Create your profile, set your packages, and get discovered by brands looking for creators like you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={loading}>
                Join as Influencer
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => !loading && selectRole('brand')}
          >
            <CardHeader>
              <div className="text-4xl mb-2">🏢</div>
              <CardTitle>I'm a Brand</CardTitle>
              <CardDescription>
                Discover and hire the perfect influencers for your campaigns. Manage everything in one place.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={loading}>
                Join as Brand
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}