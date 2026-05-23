import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatFollowers } from '@/lib/types'

export const metadata = {
  title: "GrabCollab — Hire Indian Instagram Creators",
  description: "Post a campaign, search verified creators, and hire the perfect match for your brand.",
}

export default async function Landing() {
  const supabase = await createClient()
  const { data: creators } = await supabase
    .from('creator_profiles')
    .select('id, username, display_name, city, niches, instagram_followers, content_packages(price_inr)')
    .eq('is_profile_live', true)
    .order('instagram_followers', { ascending: false })
    .limit(6)

  const GRADIENTS = ['from-[#9FE870] to-[#163300]','from-violet-400 to-purple-700','from-orange-300 to-rose-600','from-sky-300 to-blue-700','from-amber-300 to-orange-600','from-pink-300 to-fuchsia-600']

  return (
    <div className="text-[#121511] overflow-x-hidden" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Hero */}
      <section className="bg-[#163300]">
        <div className="max-w-[860px] mx-auto text-center px-5 md:px-10 pt-[100px] pb-16">
          <h1 className="text-[56px] md:text-[88px] font-black leading-[0.88] uppercase tracking-tight text-white mb-4">
            Find Instagram<br /><span className="text-[#9FE870]">Creators</span><br />for Your Brand
          </h1>
          <p className="text-[18px] text-white/60 leading-relaxed max-w-[480px] mx-auto mb-10">
            Post a campaign, search verified Indian creators, and hire the perfect match — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/brand/campaigns/new" className="bg-[#9FE870] text-[#163300] font-bold text-[17px] px-10 py-4 rounded-full hover:bg-[#8fdc60] transition-colors">Post a Campaign →</Link>
            <Link href="/brand/search" className="bg-white/10 border border-white/20 text-white font-bold text-[17px] px-10 py-4 rounded-full hover:bg-white/20 transition-colors">Browse Creators</Link>
          </div>
          <p className="text-[14px] text-white/40">500+ creators · 100+ brands · Completely free to start</p>
        </div>
      </section>

      {/* Featured creators */}
      <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1360px] mx-auto">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-2">Browse Creators</p>
              <h2 className="text-[48px] md:text-[60px] font-black text-[#121511] leading-[0.9] uppercase">Top Creators<br /><span className="text-[#45A905]">on GrabCollab</span></h2>
            </div>
            <Link href="/brand/search" className="inline-flex items-center gap-2 bg-[#163300] text-[#9FE870] font-bold text-[14px] px-6 py-3 rounded-full hover:bg-[#1c4400] transition-colors flex-shrink-0">See All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(creators?.length ? creators : Array.from({ length: 6 }, (_, i) => ({ id: `ex${i}`, username: null, display_name: ['Priya Sharma','Arjun Mehta','Kavya Rao','Vikram Singh','Meera Nair','Rahul Yadav'][i], city: ['Mumbai','Pune','Jaipur','Chennai','Kochi','Delhi'][i], niches: [['Fashion'],['Fitness'],['Comedy'],['Finance'],['Food'],['Comedy']][i], instagram_followers: [180000,34000,312000,94000,67000,312000][i], content_packages: [{ price_inr: 8000 }] }))).map((c: any, i) => {
              const minPrice = c.content_packages?.length ? Math.min(...c.content_packages.map((p: any) => p.price_inr)) : null
              return (
                <Link key={c.id} href={c.username ? `/${c.username}` : '/signup?role=brand'} className="group bg-white rounded-[20px] overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200">
                  <div className={`h-[120px] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} relative flex items-center justify-center`}>
                    <span className="text-[48px] font-black text-white/10">{c.display_name?.[0]}</span>
                    <div className="absolute -bottom-7 left-4 w-14 h-14 rounded-full bg-[#163300] border-4 border-white flex items-center justify-center text-[#9FE870] font-black text-[18px] z-10">
                      {c.display_name?.[0]}
                    </div>
                  </div>
                  <div className="pt-10 px-4 pb-4">
                    <p className="text-[14px] font-bold text-[#121511] leading-tight">{c.display_name}</p>
                    <p className="text-[12px] text-[#6A6C6A] mb-2">{c.city}{c.niches?.[0] ? ` · ${c.niches[0]}` : ''}</p>
                    {c.instagram_followers && <p className="text-[12px] text-[#6A6C6A] mb-2">📸 {formatFollowers(c.instagram_followers)} followers</p>}
                    <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between">
                      {minPrice ? <p className="text-[13px] font-black text-[#121511]">from ₹{minPrice.toLocaleString('en-IN')}</p> : <span />}
                      <span className="text-[11px] font-bold text-[#163300] bg-[#EDEFEB] group-hover:bg-[#163300] group-hover:text-[#9FE870] px-2.5 py-1 rounded-full transition-colors">View →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1360px] mx-auto">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-3">How It Works</p>
          <h2 className="text-[48px] md:text-[68px] font-black text-[#121511] uppercase leading-[0.88] mb-14 max-w-[600px]">Hire a creator<br /><span className="text-[#45A905]">in minutes.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-[14px] font-bold uppercase tracking-widest text-[#163300] mb-5">For Brands</p>
              <div className="space-y-4">
                {['Post a campaign brief', 'Review creator applications', 'Shortlist & chat with creators', 'Select your creator & collaborate'].map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#163300] text-[#9FE870] font-black text-[14px] flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <p className="text-[16px] font-semibold text-[#121511]">{s}</p>
                  </div>
                ))}
              </div>
              <Link href="/signup?role=brand" className="mt-8 inline-block bg-[#163300] text-[#9FE870] font-bold text-[15px] px-8 py-4 rounded-full hover:bg-[#1c4400] transition-colors">Join as Brand →</Link>
            </div>
            <div>
              <p className="text-[14px] font-bold uppercase tracking-widest text-[#163300] mb-5">For Creators</p>
              <div className="space-y-4">
                {['Create your free profile in 5 minutes', 'Browse brand campaigns', 'Apply with your cover note & rate', 'Get selected & start collaborating'].map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#9FE870] text-[#163300] font-black text-[14px] flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <p className="text-[16px] font-semibold text-[#121511]">{s}</p>
                  </div>
                ))}
              </div>
              <Link href="/signup?role=creator" className="mt-8 inline-block bg-[#9FE870] text-[#163300] font-bold text-[15px] px-8 py-4 rounded-full hover:bg-[#8fdc60] transition-colors">Join as Creator →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#163300] py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1360px] mx-auto flex flex-wrap justify-center gap-x-16 gap-y-8">
          {[['500+','Creators'],['100+','Brands'],['10+','Niches'],['Free','To Join']].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-[52px] font-black text-[#9FE870] leading-none">{v}</p>
              <p className="text-[14px] text-white/50 mt-2">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-[100px] px-5 md:px-[70px] text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-[52px] md:text-[72px] font-black text-[#121511] uppercase leading-[0.88] mb-6">Start finding creators today.</h2>
          <p className="text-[18px] text-[#6A6C6A] mb-10">It&rsquo;s completely free to post a campaign and browse creators.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/brand/search" className="bg-[#163300] text-[#9FE870] font-bold text-[17px] px-10 py-4 rounded-full hover:bg-[#1c4400] transition-colors">Search Creators →</Link>
            <Link href="/brand/campaigns/new" className="bg-[#EDEFEB] text-[#163300] font-bold text-[17px] px-10 py-4 rounded-full hover:bg-[#E0E2DE] transition-colors">Post a Campaign</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E8E8] px-5 md:px-[70px] py-[60px]">
        <div className="max-w-[1360px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <p className="text-[20px] font-black text-[#163300] mb-2">GrabCollab</p>
              <p className="text-[14px] text-[#6A6C6A] leading-relaxed">India&rsquo;s creator hiring portal for Instagram creators and brands.</p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#45A905] mb-4">Platform</p>
              <ul className="space-y-2.5">{[['Search Creators','/brand/search'],['Post Campaign','/brand/campaigns/new'],['How It Works','/#how-it-works']].map(([l,h]) => <li key={l}><Link href={h} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>)}</ul>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#45A905] mb-4">For Creators</p>
              <ul className="space-y-2.5">{[['Join as Creator','/signup?role=creator'],['Browse Campaigns','/signup?role=creator'],['Creator Landing','/for-creators']].map(([l,h]) => <li key={l}><Link href={h} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>)}</ul>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#45A905] mb-4">Company</p>
              <ul className="space-y-2.5">{[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Login','/login']].map(([l,h]) => <li key={l}><Link href={h} className="text-[14px] text-[#6A6C6A] hover:text-[#163300] transition-colors">{l}</Link></li>)}</ul>
            </div>
          </div>
          <div className="border-t border-[#E8E8E8] pt-6 flex items-center justify-between text-[13px] text-[#6A6C6A]">
            <span>© 2025 GrabCollab. All rights reserved.</span>
            <span>Made in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
