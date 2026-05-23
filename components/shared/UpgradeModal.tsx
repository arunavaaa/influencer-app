'use client'

import { X, Check, Zap } from 'lucide-react'
import Link from 'next/link'

type UpgradeModalProps = {
  onClose: () => void
  trigger?: string // what feature triggered this — shown as context
}

const PLANS = [
  {
    id: 'free',
    name: 'FREE',
    price: null,
    description: 'Browse and explore',
    commission: '10%',
    cta: null,
    current: true,
    features: [
      { text: 'Browse 10,000+ creators', included: true },
      { text: 'Direct hire from profiles', included: true },
      { text: 'Escrow-protected payments', included: true },
      { text: 'Post campaigns', included: false },
      { text: 'Advanced search filters', included: false },
      { text: 'Chat before hiring', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 499,
    description: 'For growing brands',
    commission: '10%',
    cta: 'Upgrade to Pro',
    highlight: true,
    features: [
      { text: 'Browse 10,000+ creators', included: true },
      { text: 'Direct hire from profiles', included: true },
      { text: 'Escrow-protected payments', included: true },
      { text: '3 campaigns/month', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'Chat before hiring', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'scale',
    name: 'SCALE',
    price: 999,
    description: 'For power users',
    commission: '5%',
    cta: 'Upgrade to Scale',
    features: [
      { text: 'Browse 10,000+ creators', included: true },
      { text: 'Direct hire from profiles', included: true },
      { text: 'Escrow-protected payments', included: true },
      { text: 'Unlimited campaigns', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'Chat before hiring', included: true },
      { text: 'Priority support', included: true },
    ],
  },
]

const TRIGGER_COPY: Record<string, string> = {
  chat: 'Message creators before hiring',
  filters: 'Advanced search filters',
  campaigns: 'Post campaigns & get applications',
  default: 'Unlock more features',
}

export function UpgradeModal({ onClose, trigger = 'default' }: UpgradeModalProps) {
  const headline = TRIGGER_COPY[trigger] || TRIGGER_COPY.default

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[860px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between border-b border-[#E8E8E8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#9FE870]" />
              <span className="text-[13px] font-bold text-[#163300] uppercase tracking-wider">Upgrade your plan</span>
            </div>
            <h2 className="text-[24px] font-black text-[#121511]">{headline}</h2>
            <p className="text-[14px] text-[#6A6C6A] mt-1">requires Pro or Scale. Compare plans below.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDEFEB] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-[#6A6C6A]" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-8 grid grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`rounded-[20px] p-5 flex flex-col relative ${
                plan.highlight
                  ? 'bg-[#163300] text-white'
                  : 'bg-[#EDEFEB] text-[#121511]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#9FE870] rounded-full text-[11px] font-black text-[#163300] whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="mb-4">
                <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${plan.highlight ? 'text-[#9FE870]' : 'text-[#6A6C6A]'}`}>
                  {plan.name}
                </p>
                <p className={`text-[13px] mb-3 ${plan.highlight ? 'text-white/70' : 'text-[#6A6C6A]'}`}>
                  {plan.description}
                </p>
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-[32px] font-black ${plan.highlight ? 'text-white' : 'text-[#121511]'}`}>
                      ₹{plan.price}
                    </span>
                    <span className={`text-[13px] ${plan.highlight ? 'text-white/60' : 'text-[#6A6C6A]'}`}>/month</span>
                  </div>
                ) : (
                  <span className={`text-[32px] font-black ${plan.highlight ? 'text-white' : 'text-[#121511]'}`}>₹0</span>
                )}
                <p className={`text-[12px] mt-1 ${plan.highlight ? 'text-white/60' : 'text-[#6A6C6A]'}`}>
                  {plan.commission} platform commission
                </p>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {f.included ? (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-[#9FE870]' : 'bg-[#163300]'}`}>
                        <Check className={`w-2.5 h-2.5 ${plan.highlight ? 'text-[#163300]' : 'text-[#9FE870]'}`} />
                      </div>
                    ) : (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-white/10' : 'bg-[#B0B2AF]/30'}`}>
                        <X className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white/40' : 'text-[#B0B2AF]'}`} />
                      </div>
                    )}
                    <span className={`text-[12px] ${f.included ? (plan.highlight ? 'text-white' : 'text-[#121511]') : (plan.highlight ? 'text-white/40' : 'text-[#B0B2AF]')}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {plan.cta ? (
                <Link
                  href="/pricing"
                  onClick={onClose}
                  className={`w-full py-3 rounded-[12px] text-[14px] font-black text-center transition-colors ${
                    plan.highlight
                      ? 'bg-[#9FE870] text-[#163300] hover:bg-[#8fd960]'
                      : 'bg-[#163300] text-white hover:bg-[#1e4a00]'
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <div className="w-full py-3 rounded-[12px] text-[14px] font-semibold text-center bg-white/60 text-[#6A6C6A] cursor-default">
                  Current plan
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-[12px] text-[#6A6C6A] pb-6">
          Billed annually · Cancel anytime · GST applicable
        </p>
      </div>
    </div>
  )
}
