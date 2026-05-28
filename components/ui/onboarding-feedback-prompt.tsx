'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2 } from 'lucide-react'

export function OnboardingFeedbackPrompt({
  userRole,
  onClose,
}: {
  userRole: 'creator' | 'brand'
  onClose: () => void
}) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  async function submit() {
    if (!message.trim()) { onClose(); return }
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'onboarding',
          message,
          page_url: `/onboarding/${userRole}`,
        }),
      })
      setDone(true)
      setTimeout(onClose, 2200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[440px] shadow-xl">

        {done ? (
          <div className="flex flex-col items-center py-12 px-6">
            <CheckCircle2 className="w-14 h-14 text-[#163300] mb-4" />
            <p className="text-[18px] font-black text-[#121511] mb-1">Thanks so much! 🙏</p>
            <p className="text-[14px] text-[#6A6C6A]">This really helps us improve the experience.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F0F0F0]">
              <div>
                <p className="text-[17px] font-black text-[#121511]">🎉 One quick question...</p>
                <p className="text-[13px] text-[#6A6C6A] mt-1 leading-relaxed">
                  What's one thing you wish was <br className="hidden sm:block" />clearer during setup?
                </p>
              </div>
              <button onClick={onClose} className="text-[#9A9C9A] hover:text-[#121511] flex-shrink-0 mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Textarea */}
            <div className="px-6 py-5">
              <textarea
                rows={4}
                maxLength={500}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  userRole === 'creator'
                    ? 'e.g. I wasn\'t sure what follower range to pick…'
                    : 'e.g. I wasn\'t sure which niche to choose…'
                }
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-[#FAFAFA] text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] resize-none transition-colors"
              />
              <p className="text-[11px] text-[#9A9C9A] text-right mt-1">{message.length}/500</p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-semibold text-[#6A6C6A] hover:border-[#163300]/40 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 py-3 bg-[#163300] text-[#9FE870] rounded-full text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : 'Send Feedback →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
