'use client'

import { useState } from 'react'
import { MessageSquare, X, Loader2, CheckCircle2 } from 'lucide-react'

const TYPES = [
  { value: 'bug',        label: '🐛 Bug Report' },
  { value: 'suggestion', label: '💡 Suggestion' },
  { value: 'confusing',  label: '😕 Confusing' },
  { value: 'general',    label: '💬 General' },
] as const

type FeedbackType = typeof TYPES[number]['value']

const PLACEHOLDERS: Record<FeedbackType, string> = {
  bug:        'What happened? What were you trying to do?',
  suggestion: 'What feature or improvement would help you most?',
  confusing:  'What was unclear or hard to understand?',
  general:    "What's on your mind?",
}

export function FeedbackWidget() {
  const [open, setOpen]       = useState(false)
  const [type, setType]       = useState<FeedbackType>('general')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  function close() {
    setOpen(false)
    setDone(false)
    setMessage('')
    setType('general')
  }

  async function submit() {
    if (!message.trim()) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, page_url: window.location.pathname }),
      })
      setDone(true)
      setTimeout(close, 2200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating pill button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Share feedback"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#163300] text-[#9FE870] px-4 py-2.5 rounded-full shadow-lg hover:bg-[#1f4a00] active:scale-95 transition-all text-[13px] font-bold select-none"
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0" />
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
          onClick={e => e.target === e.currentTarget && close()}
        >
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] w-full sm:max-w-[440px] shadow-xl">

            {done ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-12 px-6">
                <CheckCircle2 className="w-14 h-14 text-[#163300] mb-4" />
                <p className="text-[18px] font-black text-[#121511] mb-1">Thank you! 🙏</p>
                <p className="text-[14px] text-[#6A6C6A]">Your feedback helps us build a better product.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F0F0F0]">
                  <div>
                    <h3 className="text-[17px] font-black text-[#121511]">Share Feedback</h3>
                    <p className="text-[13px] text-[#6A6C6A] mt-0.5">Help us make GrabCollab better.</p>
                  </div>
                  <button onClick={close} className="text-[#9A9C9A] hover:text-[#121511] flex-shrink-0 mt-0.5">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Type chips */}
                <div className="px-6 pt-5 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border-2 transition-all ${
                          type === t.value
                            ? 'bg-[#163300] text-[#9FE870] border-[#163300]'
                            : 'bg-white text-[#4A4C4A] border-[#E8E8E8] hover:border-[#163300]/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="px-6 pb-2">
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={PLACEHOLDERS[type]}
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-[#FAFAFA] text-[14px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] resize-none transition-colors"
                  />
                  <p className="text-[11px] text-[#9A9C9A] text-right mt-1">{message.length}/1000</p>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 pb-6 pt-2">
                  <button
                    onClick={close}
                    className="flex-1 py-3 border-2 border-[#E8E8E8] rounded-full text-[14px] font-semibold text-[#6A6C6A] hover:border-[#163300]/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading || !message.trim()}
                    className="flex-1 py-3 bg-[#163300] text-[#9FE870] rounded-full text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : 'Send →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
