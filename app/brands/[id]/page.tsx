import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BrandPublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: brand } = await supabase.from('brand_profiles').select('*').eq('id', id).maybeSingle()
  if (!brand) notFound()

  const { data: campaigns } = await supabase.from('campaigns').select('id, title, platforms, niches, budget_inr, application_deadline').eq('brand_id', id).eq('status', 'open').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#EDEFEB] pt-6 pb-16 px-5" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="max-w-[760px] mx-auto">
        <div className="bg-white rounded-[24px] p-8 mb-6">
          <div className="flex items-start gap-5 mb-6">
            <div className="w-16 h-16 rounded-[16px] bg-[#163300] flex items-center justify-center text-[#9FE870] font-black text-[24px] flex-shrink-0">
              {brand.brand_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h1 className="text-[24px] font-black text-[#121511]">{brand.brand_name}</h1>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {brand.type && <span className="text-[12px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold capitalize">{brand.type}-based</span>}
                {brand.niche && <span className="text-[12px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{brand.niche}</span>}
                {brand.city && <span className="text-[12px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">📍 {brand.city}</span>}
                {brand.team_size && <span className="text-[12px] px-2.5 py-1 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">👥 {brand.team_size} people</span>}
              </div>
            </div>
          </div>
          {brand.description && <p className="text-[15px] text-[#4A4C4A] leading-relaxed mb-5">{brand.description}</p>}
          <div className="flex flex-wrap gap-3">
            {brand.website_url && <a href={brand.website_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[#163300] hover:underline">🔗 {brand.website_url.replace(/^https?:\/\/(www\.)?/, '')}</a>}
            {brand.instagram_url && <a href={brand.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[#163300] hover:underline">📸 Instagram</a>}
            {brand.youtube_url && <a href={brand.youtube_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[#163300] hover:underline">▶️ YouTube</a>}
          </div>
        </div>

        {campaigns && campaigns.length > 0 && (
          <div className="bg-white rounded-[24px] p-6">
            <h2 className="text-[20px] font-black text-[#121511] mb-5">Open Campaigns</h2>
            <div className="space-y-4">
              {campaigns.map(c => (
                <div key={c.id} className="border border-[#E8E8E8] rounded-[16px] p-4">
                  <p className="text-[16px] font-black text-[#121511] mb-2">{c.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">{c.platforms?.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 bg-[#EDEFEB] text-[#4A4C4A] rounded-full font-semibold">{p}</span>)}</div>
                  <div className="flex items-center justify-between">
                    {c.budget_inr ? <span className="text-[13px] font-bold text-[#163300]">₹{c.budget_inr.toLocaleString('en-IN')} budget</span> : <span className="text-[13px] text-[#9A9C9A]">Budget TBD</span>}
                    <Link href="/campaigns" className="text-[12px] font-bold text-[#163300] hover:underline">Apply →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
