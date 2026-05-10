'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

type BillingPeriod = 'monthly' | 'annual'

const PLANS = [
  {
    name: 'Free',
    tagline: 'Browse and explore',
    monthlyPrice: 0,
    annualPrice: 0,
    commission: '10%',
    color: 'bg-white border-[#E8E8E8]',
    buttonClass: 'border-2 border-[#163300] text-[#163300] hover:bg-[#163300] hover:text-[#9FE870]',
    features: [
      { label: 'Browse 10,000+ creators', included: true },
      { label: 'Direct hire from profiles', included: true },
      { label: 'Escrow-protected payments', included: true },
      { label: '10% platform commission', included: true },
      { label: 'Post campaigns', included: false },
      { label: 'Advanced search filters', included: false },
      { label: 'Chat before hiring', included: false },
      { label: 'Live post analytics', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    tagline: 'For growing brands',
    monthlyPrice: 2999,
    annualPrice: Math.round((2999 * 10) / 12),
    commission: '10%',
    color: 'bg-[#163300] border-[#163300]',
    popular: true,
    buttonClass: 'bg-[#9FE870] text-[#163300] hover:bg-[#8fdc60]',
    features: [
      { label: 'Browse 10,000+ creators', included: true },
      { label: 'Direct hire from profiles', included: true },
      { label: 'Escrow-protected payments', included: true },
      { label: '10% platform commission', included: true },
      { label: '1 campaign/month', included: true },
      { label: 'Advanced search filters', included: true },
      { label: 'Chat before hiring', included: true },
      { label: '5 tracked posts', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  {
    name: 'Scale',
    tagline: 'For power users',
    monthlyPrice: 7999,
    annualPrice: Math.round((7999 * 10) / 12),
    commission: '5%',
    color: 'bg-white border-[#9FE870]',
    buttonClass: 'bg-[#163300] text-[#9FE870] hover:bg-[#1f4a00]',
    features: [
      { label: 'Browse 10,000+ creators', included: true },
      { label: 'Direct hire from profiles', included: true },
      { label: 'Escrow-protected payments', included: true },
      { label: '5% platform commission', included: true },
      { label: 'Unlimited campaigns', included: true },
      { label: 'Advanced search filters', included: true },
      { label: 'Chat before hiring', included: true },
      { label: '15 tracked posts', included: true },
      { label: 'Priority support', included: true },
    ],
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('annual')

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Header */}
      <section className="bg-[#163300] px-5 md:px-[70px] py-[60px]">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="text-[48px] font-black text-[#9FE870] uppercase leading-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-[18px] text-white/80 mb-8">
            Start free. Upgrade when you need more power.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-0 bg-white/10 rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2.5 rounded-full text-[15px] font-bold transition-colors ${
                billing === 'monthly'
                  ? 'bg-[#9FE870] text-[#163300]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-6 py-2.5 rounded-full text-[15px] font-bold transition-colors ${
                billing === 'annual'
                  ? 'bg-[#9FE870] text-[#163300]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-[11px] bg-[#9FE870]/20 text-[#9FE870] px-2 py-0.5 rounded-full">
                Save 2 months
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice
            const isPopular = plan.popular

            return (
              <div
                key={plan.name}
                className={`rounded-[24px] border-2 p-8 flex flex-col relative ${plan.color} ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-[#9FE870] text-[#163300] text-[13px] font-black px-5 py-1.5 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-[12px] font-bold uppercase tracking-wider mb-1 ${isPopular ? 'text-[#9FE870]/70' : 'text-[#163300]'}`}>
                    {plan.name}
                  </p>
                  <p className={`text-[14px] mb-5 ${isPopular ? 'text-white/60' : 'text-[#6A6C6A]'}`}>
                    {plan.tagline}
                  </p>

                  <div className="flex items-baseline gap-1">
                    <span className={`text-[48px] font-black leading-none ${isPopular ? 'text-white' : 'text-[#163300]'}`}>
                      {price === 0 ? '₹0' : `₹${price.toLocaleString('en-IN')}`}
                    </span>
                    {price > 0 && (
                      <span className={`text-[14px] ${isPopular ? 'text-white/60' : 'text-[#6A6C6A]'}`}>
                        /month
                      </span>
                    )}
                  </div>
                  {billing === 'annual' && price > 0 && (
                    <p className={`text-[12px] mt-1 ${isPopular ? 'text-white/50' : 'text-[#6A6C6A]'}`}>
                      Billed annually · Save 2 months
                    </p>
                  )}

                  <div className={`mt-3 text-[14px] ${isPopular ? 'text-white/70' : 'text-[#6A6C6A]'}`}>
                    <span className="font-bold">{plan.commission}</span> platform commission
                  </div>
                </div>

                <Link
                  href="/login"
                  className={`w-full text-center font-bold text-[16px] py-4 rounded-full transition-colors mb-6 ${plan.buttonClass}`}
                >
                  {plan.monthlyPrice === 0 ? 'Get Started Free' : `Start with ${plan.name}`}
                </Link>

                <div className="flex flex-col gap-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-3">
                      {f.included ? (
                        <div className="w-5 h-5 bg-[#9FE870] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#163300]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-[#E8E8E8] rounded-full flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3 text-[#6A6C6A]" />
                        </div>
                      )}
                      <span
                        className={`text-[14px] ${
                          isPopular
                            ? f.included ? 'text-white' : 'text-white/40'
                            : f.included ? 'text-[#121511]' : 'text-[#6A6C6A]'
                        }`}
                      >
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature deep-dive */}
        <div className="mt-16 bg-white rounded-[24px] p-8">
          <h2 className="text-[25px] font-black text-[#121511] mb-8 text-center">What&apos;s Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Discover Creators', body: 'Search 10,000+ vetted Indian influencers by platform, niche, city, and follower count.' },
              { title: 'Post Campaigns', body: 'Write a brief and let creators apply. Choose who to collaborate with at your price.' },
              { title: 'Chat & Negotiate', body: 'Message creators before hiring. Negotiate rates, share briefs, agree on deliverables.' },
              { title: 'Track Results', body: 'Automatic post tracking. Monitor views, likes, comments, and engagement rates.' },
              { title: 'Safe Pay (Escrow)', body: 'Funds are held in escrow until you approve content. If declined, full refund.' },
              { title: 'GST Invoices', body: 'Automated GST-compliant invoices for every transaction. Finance team will thank you.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-10 h-10 bg-[#163300] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-[#9FE870]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#121511] mb-1">{f.title}</h3>
                  <p className="text-[14px] text-[#6A6C6A] leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div className="mt-10 bg-white rounded-[24px] p-8">
          <h2 className="text-[25px] font-black text-[#121511] mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: 'What is the platform fee?', a: 'Free and Pro plans charge 10% on top of the creator\'s price. Scale plan reduces this to 5%.' },
              { q: 'How does escrow work?', a: 'When you hire a creator, funds are held securely. They\'re released only when you approve the content, or automatically after 72 hours.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Monthly plans can be cancelled anytime. Annual plans are non-refundable but you keep access until the end of the period.' },
              { q: 'Are GST invoices included?', a: 'Yes, every transaction generates a GST-compliant invoice automatically. Great for brand finance teams.' },
              { q: 'What if a creator declines?', a: 'If a creator declines your order, the full amount is refunded to your balance within 2-3 business days.' },
              { q: 'Do you support Razorpay?', a: 'Yes, all payments are processed via Razorpay. We support UPI, credit cards, debit cards, and net banking.' },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-[#E8E8E8] pb-5">
                <h3 className="text-[16px] font-bold text-[#121511] mb-2">{faq.q}</h3>
                <p className="text-[14px] text-[#6A6C6A] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
