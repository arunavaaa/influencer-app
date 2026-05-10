'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, ChevronDown, ChevronRight, Heart, Search } from 'lucide-react'

type ListItem = {
  id: string
  influencer_id: string
  influencer_profiles: { display_name: string; city: string; niche: string[] }
}

type SavedList = {
  id: string
  name: string
  created_at: string
  items: ListItem[]
  expanded: boolean
}

export default function ListsPage() {
  const supabase = createClient()
  const [lists, setLists] = useState<SavedList[]>([])
  const [loading, setLoading] = useState(true)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [creatingList, setCreatingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  useEffect(() => {
    fetchLists()
  }, [])

  async function fetchLists() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!brand) { setLoading(false); return }
    setBrandId(brand.id)

    const { data: listsData } = await supabase
      .from('saved_lists')
      .select('id, name, created_at')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })

    if (!listsData) { setLoading(false); return }

    const listsWithItems = await Promise.all(
      listsData.map(async (list) => {
        const { data: items } = await supabase
          .from('saved_list_items')
          .select('id, influencer_id, influencer_profiles(display_name, city, niche)')
          .eq('list_id', list.id)

        return {
          ...list,
          items: (items || []) as unknown as ListItem[],
          expanded: false,
        }
      })
    )

    setLists(listsWithItems)
    setLoading(false)
  }

  async function createList() {
    if (!brandId || !newListName.trim()) return
    const { data, error } = await supabase
      .from('saved_lists')
      .insert({ brand_id: brandId, name: newListName.trim() })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create list')
    } else {
      toast.success('List created!')
      setLists((prev) => [{ ...data, items: [], expanded: true }, ...prev])
      setNewListName('')
      setCreatingList(false)
    }
  }

  async function removeFromList(listId: string, itemId: string) {
    await supabase.from('saved_list_items').delete().eq('id', itemId)
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
      )
    )
    toast.success('Removed from list')
  }

  function toggleExpand(listId: string) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, expanded: !l.expanded } : l))
    )
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E8] px-5 md:px-[70px] py-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[30px] font-black text-[#121511]">Lists</h1>
            <p className="text-[16px] text-[#6A6C6A] mt-1">
              Save and organise your favourite creators
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/brand/discover"
              className="flex items-center gap-2 border-2 border-[#163300] text-[#163300] font-bold text-[15px] px-5 py-2.5 rounded-full hover:bg-[#163300] hover:text-[#9FE870] transition-colors"
            >
              <Search className="w-4 h-4" />
              Find Creators
            </Link>
            <button
              onClick={() => setCreatingList(true)}
              className="flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[15px] px-5 py-2.5 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New List
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-8">
        {/* Create list form */}
        {creatingList && (
          <div className="bg-white rounded-[24px] p-5 mb-5 flex gap-3">
            <input
              type="text"
              placeholder="List name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()}
              autoFocus
              className="flex-1 text-[15px] px-4 py-2.5 rounded-[12px] border border-[#E8E8E8] focus:outline-none focus:border-[#163300]"
            />
            <button
              onClick={createList}
              className="bg-[#9FE870] text-[#163300] font-bold text-[14px] px-5 py-2.5 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setCreatingList(false)}
              className="text-[#6A6C6A] font-medium text-[14px] px-4 py-2.5 hover:bg-[#EDEFEB] rounded-full"
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <div className="bg-white rounded-[24px] p-16 text-center">
            <div className="w-16 h-16 bg-[#EDEFEB] rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-[#6A6C6A]" />
            </div>
            <p className="text-[18px] font-bold text-[#121511] mb-2">No lists yet</p>
            <p className="text-[14px] text-[#6A6C6A] mb-6">
              Your saved influencers will appear here. To add an influencer to a list,
              click the save button on their profile.
            </p>
            <Link
              href="/brand/discover"
              className="inline-block bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
            >
              Explore Influencers
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {lists.map((list) => (
              <div key={list.id} className="bg-white rounded-[24px] overflow-hidden">
                <button
                  onClick={() => toggleExpand(list.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-[#EDEFEB]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#9FE870] rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-[#163300] fill-[#163300]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[18px] font-black text-[#121511]">{list.name}</p>
                      <p className="text-[13px] text-[#6A6C6A]">
                        {list.items.length} creator{list.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {list.expanded ? (
                    <ChevronDown className="w-5 h-5 text-[#6A6C6A]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#6A6C6A]" />
                  )}
                </button>

                {list.expanded && (
                  <div className="border-t border-[#E8E8E8] px-6 pb-4">
                    {list.items.length === 0 ? (
                      <p className="text-[14px] text-[#6A6C6A] py-4 text-center">
                        This list is empty. Browse creators to add them.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                        {list.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-[#EDEFEB] rounded-[12px] px-4 py-3">
                            <Link href={`/influencer/${item.influencer_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 bg-[#163300] rounded-full flex items-center justify-center text-[#9FE870] text-[13px] font-black flex-shrink-0">
                                {item.influencer_profiles?.display_name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-bold text-[#121511] truncate">
                                  {item.influencer_profiles?.display_name || 'Creator'}
                                </p>
                                <p className="text-[12px] text-[#6A6C6A] truncate">
                                  {item.influencer_profiles?.city || 'India'}
                                </p>
                              </div>
                            </Link>
                            <button
                              onClick={() => removeFromList(list.id, item.id)}
                              className="ml-2 p-1 hover:bg-white rounded-full transition-colors flex-shrink-0"
                            >
                              <Heart className="w-4 h-4 fill-red-400 stroke-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
