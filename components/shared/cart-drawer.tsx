'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'

type CartItem = {
  id: string
  influencer_id: string
  package_id: string
  influencer_profiles: {
    display_name: string
  }
  content_packages: {
    platform: string
    format: string
    price_inr: number
    delivery_days: number
  }
}

type Props = {
  open: boolean
  onClose: () => void
}

const FORMAT_LABEL: Record<string, string> = {
  reel: 'Reel', post: 'Post', story: 'Story', ugc: 'UGC',
  youtube_video: 'YouTube Video', youtube_short: 'YouTube Short',
}

export function CartDrawer({ open, onClose }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) fetchCart()
  }, [open])

  async function fetchCart() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: brand } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!brand) { setLoading(false); return }

    const { data } = await supabase
      .from('cart_items')
      .select(`
        id, influencer_id, package_id,
        influencer_profiles(display_name),
        content_packages(platform, format, price_inr, delivery_days)
      `)
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })

    setItems((data || []) as unknown as CartItem[])
    setLoading(false)
  }

  async function removeItem(itemId: string) {
    await supabase.from('cart_items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    toast.success('Removed from cart')
  }

  const subtotal = items.reduce(
    (s, i) => s + (i.content_packages?.price_inr || 0),
    0
  )

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E8E8]">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-[#163300]" />
            <h2 className="text-[20px] font-black text-[#121511]">Cart</h2>
            {items.length > 0 && (
              <span className="bg-[#9FE870] text-[#163300] text-[12px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#EDEFEB] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#6A6C6A]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-[#EDEFEB] rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-[#6A6C6A]" />
              </div>
              <p className="text-[18px] font-bold text-[#121511] mb-2">Your cart is empty</p>
              <p className="text-[14px] text-[#6A6C6A] mb-6">
                Browse creators and add packages to get started.
              </p>
              <button
                onClick={onClose}
                className="bg-[#9FE870] text-[#163300] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#8fdc60] transition-colors"
              >
                Discover Creators
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#EDEFEB] rounded-[16px] p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-[15px] font-bold text-[#121511]">
                      {item.influencer_profiles?.display_name || 'Creator'}
                    </p>
                    <p className="text-[13px] text-[#6A6C6A] mt-0.5 capitalize">
                      {item.content_packages?.platform} · {FORMAT_LABEL[item.content_packages?.format] || item.content_packages?.format}
                    </p>
                    <p className="text-[13px] text-[#6A6C6A]">
                      {item.content_packages?.delivery_days}d delivery
                    </p>
                    <p className="text-[18px] font-black text-[#163300] mt-2">
                      ₹{item.content_packages?.price_inr?.toLocaleString('en-IN') || '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 hover:bg-white rounded-full transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E8E8E8] px-6 py-5">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#6A6C6A]">Subtotal ({items.length} items)</span>
                <span className="font-bold text-[#121511]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#6A6C6A]">Platform fee (10%)</span>
                <span className="font-bold text-[#121511]">
                  ₹{Math.round(subtotal * 0.1).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[16px] font-black pt-2 border-t border-[#E8E8E8]">
                <span className="text-[#121511]">Total</span>
                <span className="text-[#163300]">
                  ₹{Math.round(subtotal * 1.1).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <p className="text-[12px] text-[#6A6C6A] mb-4 text-center">
              🔒 Escrow-protected · If a package is declined, funds are refunded
            </p>
            <button className="w-full flex items-center justify-center gap-2 bg-[#9FE870] text-[#163300] font-black text-[16px] py-4 rounded-full hover:bg-[#8fdc60] transition-colors">
              Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* Utility function for other pages to add to cart */
export async function addToCart(packageId: string, influencerId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    toast.error('Please sign in to add to cart')
    return false
  }

  const { data: brand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!brand) {
    toast.error('Only brands can add to cart')
    return false
  }

  const { error } = await supabase.from('cart_items').insert({
    brand_id: brand.id,
    influencer_id: influencerId,
    package_id: packageId,
  })

  if (error) {
    if (error.code === '23505') {
      toast.info('Already in cart')
    } else {
      toast.error('Failed to add to cart')
    }
    return false
  }

  toast.success('Added to cart!')
  return true
}
