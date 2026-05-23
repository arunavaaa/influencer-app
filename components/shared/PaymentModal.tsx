'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Loader2, X, CheckCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  handler: (response: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
}

type PaymentModalProps = {
  contractId: string
  agreedPriceInr: number
  creatorName: string
  packageFormat: string
  onSuccess: () => void
  onClose: () => void
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function PaymentModal({
  contractId,
  agreedPriceInr,
  creatorName,
  packageFormat,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  const platformFee = Math.round(agreedPriceInr * 0.10)
  const total = agreedPriceInr + platformFee

  function fmtINR(n: number) {
    return `₹${n.toLocaleString('en-IN')}`
  }

  async function startPayment() {
    setLoading(true)
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      toast.error('Could not load payment gateway — check your internet connection.')
      setLoading(false)
      return
    }

    // Create Razorpay order server-side
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error || 'Failed to create payment order')
      setLoading(false)
      return
    }

    const { orderId, amount, currency, keyId } = await res.json()
    setLoading(false)

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: 'Crayon',
      description: `${packageFormat} · ${creatorName}`,
      order_id: orderId,
      theme: { color: '#163300' },
      handler: async (response: RazorpayResponse) => {
        // Verify payment server-side
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            contractId,
          }),
        })

        if (verifyRes.ok) {
          setPaid(true)
          toast.success('Payment successful! Funds held in escrow.')
          setTimeout(() => onSuccess(), 1500)
        } else {
          toast.error('Payment verification failed — please contact support.')
        }
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled. Your hire request is saved — you can pay later from My Orders.')
        },
      },
    })

    rzp.open()
  }

  if (paid) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-[24px] p-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-[#9FE870] flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8 text-[#163300]" />
          </div>
          <p className="text-[22px] font-black text-[#121511] mb-2">Payment received</p>
          <p className="text-[14px] text-[#6A6C6A]">
            {fmtINR(total)} is now held in escrow. {creatorName} has been notified and has 48 hours to accept.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[420px]">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 flex items-start justify-between border-b border-[#E8E8E8]">
          <div>
            <p className="text-[13px] font-bold text-[#9FE870] uppercase tracking-widest mb-0.5">Step 3 of 3</p>
            <h2 className="text-[20px] font-black text-[#121511]">Fund the escrow</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDEFEB] transition-colors"
          >
            <X className="w-4 h-4 text-[#6A6C6A]" />
          </button>
        </div>

        {/* Breakdown */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-between text-[14px]">
            <span className="text-[#6A6C6A]">{packageFormat} package</span>
            <span className="font-semibold text-[#121511]">{fmtINR(agreedPriceInr)}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-[#6A6C6A]">Platform fee (10%)</span>
            <span className="font-semibold text-[#121511]">{fmtINR(platformFee)}</span>
          </div>
          <div className="flex justify-between text-[16px] pt-3 border-t border-[#E8E8E8]">
            <span className="font-black text-[#121511]">Total</span>
            <span className="font-black text-[#163300]">{fmtINR(total)}</span>
          </div>
        </div>

        {/* Escrow explainer */}
        <div className="mx-6 mb-5 p-4 rounded-[14px] bg-[#EDEFEB] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#163300] flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#6A6C6A] leading-relaxed">
            Your money is held securely in escrow and only released to {creatorName} after <strong className="text-[#121511]">you approve their content</strong>. If they decline, you get a full refund.
          </p>
        </div>

        {/* Pay CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={startPayment}
            disabled={loading}
            className="w-full py-4 rounded-[14px] bg-[#163300] text-[#9FE870] text-[16px] font-black hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Opening payment…</>
              : <><Lock className="w-4 h-4" /> Pay {fmtINR(total)} securely</>
            }
          </button>
          <p className="text-center text-[11px] text-[#B0B2AF] mt-3">
            Powered by Razorpay · UPI, cards, net banking accepted · GST applicable
          </p>
        </div>
      </div>
    </div>
  )
}
