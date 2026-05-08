'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Influencer = {
  id: string
  display_name: string
  bio: string
  city: string
  niche: string[]
  language: string[]
  reputation_score: number
}

const NICHES = ['Fashion', 'Food', 'Tech', 'Finance', 'Fitness', 'Travel', 'Beauty', 'Gaming', 'Parenting', 'Education', 'Lifestyle', 'Comedy']

export default function DiscoverPage() {
  const supabase = createClient()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState('')

  useEffect(() => {
    fetchInfluencers()
  }, [selectedNiche])

  async function fetchInfluencers() {
    setLoading(true)

    let query = supabase
      .from('influencer_profiles')
      .select('id, display_name, bio, city, niche, language, reputation_score')
      .eq('is_profile_live', true)

    if (selectedNiche) {
      query = query.contains('niche', [selectedNiche])
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
    } else {
      setInfluencers(data || [])
    }

    setLoading(false)
  }

  const filtered = influencers.filter(inf => {
    const matchesSearch = search === '' ||
      inf.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      inf.city?.toLowerCase().includes(search.toLowerCase())

    const matchesCity = selectedCity === '' ||
      inf.city?.toLowerCase().includes(selectedCity.toLowerCase())

    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b px-8 py-6">
        <h1 className="text-2xl font-bold">Discover Influencers</h1>
        <p className="text-muted-foreground mt-1">Find the perfect creator for your brand</p>
      </div>

      <div className="flex gap-8 px-8 py-6">
        {/* Filters sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Search</p>
              <Input
                placeholder="Name or city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">City</p>
              <Input
                placeholder="e.g. Mumbai"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Niche</p>
              <div className="flex flex-wrap gap-2">
                {NICHES.map(niche => (
                  <Badge
                    key={niche}
                    variant={selectedNiche === niche ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedNiche(selectedNiche === niche ? null : niche)}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setSelectedNiche(null)
                setSelectedCity('')
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        {/* Influencer grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading influencers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No influencers found. Try changing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(influencer => (
                <Card key={influencer.id} className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold mb-2">
                          {influencer.display_name?.[0] || '?'}
                        </div>
                        <h3 className="font-semibold">{influencer.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{influencer.city}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ⭐ {influencer.reputation_score}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {influencer.bio || 'No bio yet.'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {influencer.niche?.slice(0, 3).map(n => (
                        <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                      ))}
                      {influencer.niche?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{influencer.niche.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}