import Link from 'next/link'

export const metadata = { title: 'For Creators — GrabCollab', description: 'Get paid to work with brands you love. Create your free profile on GrabCollab.' }

export default async function ForCreators() {
  return (
    <div className="text-[#121511]" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Hero */}
      <section className="bg-[#163300] px-5 md:px-[70px] pt-[100px] pb-[80px]">
        <div className="max-w-[860px] mx-auto text-center">
          <p className="text-[#9FE870] text-[13px] font-black uppercase tracking-[0.2em] mb-4">For Creators</p>
          <h1 className="text-[56px] md:text-[88px] font-black leading-[0.88] uppercase text-white mb-5">
            Get Paid to Work<br />With <span className="text-[#9FE870]">Brands</span><br />You Love
          </h1>
          <p className="text-[18px] text-white/60 leading-relaxed max-w-[460px] mx-auto mb-10">
            Create your free profile, apply to brand campaigns, and land your first deal. No minimum followers.
          </p>
          <Link href="/onboarding/creator" className="inline-block bg-[#9FE870] text-[#163300] font-bold text-[18px] px-12 py-5 rounded-full hover:bg-[#8fdc60] transition-colors">
            Create Your Free Profile →
          </Link>
          <p className="text-[13px] text-white/30 mt-6">Free forever · No minimum followers · 5 minutes to set up</p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#EDEFEB] py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1000px] mx-auto">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#45A905] mb-3 text-center">How It Works</p>
          <h2 className="text-[48px] font-black text-[#121511] uppercase leading-[0.9] mb-14 text-center">3 steps to your<br /><span className="text-[#45A905]">first brand deal.</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Create your free profile', body: 'Set up your profile in 5 minutes. Add your niche, social links, follower count, and content packages.' },
              { n: '02', title: 'Apply to brand campaigns', body: 'Browse campaigns posted by real brands. Apply with a cover note and your proposed rate.' },
              { n: '03', title: 'Chat, collaborate, earn', body: 'Brand shortlists you, you chat directly, agree on terms, and deliver. Simple as that.' },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-[24px] p-7">
                <span className="text-[60px] font-black text-[#163300]/10 leading-none block">{s.n}</span>
                <h3 className="text-[20px] font-black text-[#121511] mt-3 mb-2">{s.title}</h3>
                <p className="text-[15px] text-[#6A6C6A] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why GrabCollab */}
      <section className="bg-white py-[80px] px-5 md:px-[70px]">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="text-[48px] font-black text-[#121511] uppercase leading-[0.9] mb-12 text-center">Why GrabCollab?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { emoji: '🆓', title: 'Free to join', body: 'No subscription. No upfront cost. Always.' },
              { emoji: '📣', title: 'Brands come to you', body: 'Brands post campaigns and you apply. Or they find you and message directly.' },
              { emoji: '🤝', title: 'No middlemen', body: 'Chat directly with brands. No agency cut.' },
              { emoji: '🌟', title: 'Nano to macro', body: 'Works for creators with 1K followers or 1M.' },
            ].map(f => (
              <div key={f.title} className="bg-[#EDEFEB] rounded-[20px] p-5">
                <div className="text-[32px] mb-3">{f.emoji}</div>
                <p className="text-[15px] font-black text-[#121511] mb-1">{f.title}</p>
                <p className="text-[13px] text-[#6A6C6A]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#163300] py-[100px] px-5 md:px-[70px] text-center">
        <div className="max-w-[560px] mx-auto">
          <h2 className="text-[52px] font-black text-white uppercase leading-[0.88] mb-5">Your first brand deal starts here.</h2>
          <p className="text-[17px] text-white/55 mb-10">Create your free GrabCollab profile today. It takes 5 minutes.</p>
          <Link href="/onboarding/creator" className="inline-block bg-[#9FE870] text-[#163300] font-bold text-[18px] px-12 py-5 rounded-full hover:bg-[#8fdc60] transition-colors">
            Create Your Free Profile →
          </Link>
        </div>
      </section>
    </div>
  )
}
