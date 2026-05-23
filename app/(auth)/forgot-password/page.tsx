'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    if (!email.includes('@')) { toast.error('Enter a valid email address'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setSent(true)
  }

  return (
    <div className="h-screen overflow-hidden -mt-16 flex items-center justify-center bg-white" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="w-full max-w-[400px] px-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-[13px] text-[#6A6C6A] hover:text-[#163300] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#9FE870] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#163300]" />
            </div>
            <h1 className="text-[28px] font-black text-[#121511] mb-2">Check your email</h1>
            <p className="text-[15px] text-[#6A6C6A] mb-6">
              We&apos;ve sent a password reset link to <span className="font-semibold text-[#121511]">{email}</span>
            </p>
            <p className="text-[13px] text-[#6A6C6A]">
              Didn&apos;t receive it?{' '}
              <button onClick={() => setSent(false)} className="text-[#163300] font-semibold hover:underline">
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[28px] font-black text-[#121511] mb-1">Forgot password?</h1>
            <p className="text-[15px] text-[#6A6C6A] mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <div className="mb-6">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
