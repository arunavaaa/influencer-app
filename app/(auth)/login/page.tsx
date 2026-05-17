'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  async function signInWithEmail() {
    if (!email || !password) { toast.error('Enter your email and password'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role === 'influencer') router.push('/influencer/home')
    else if (userData?.role === 'brand') router.push('/brand/home')
    else router.push('/onboarding/creator')
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>

      {/* ── Left panel: background image + tagline ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <Image
          src="/login-bg.png"
          alt="Creator"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay — darker on left/bottom for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(22,51,0,0.72) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
          }}
        />

        {/* Crayon wordmark */}
        <Link
          href="/"
          className="absolute top-8 left-10 text-[22px] font-black text-white tracking-tight hover:opacity-80 transition-opacity z-10"
        >
          Crayon
        </Link>

        {/* Tagline — bottom left, like Envato */}
        <div className="absolute bottom-12 left-10 z-10 max-w-[420px]">
          <p className="text-[#9FE870] text-[13px] font-black uppercase tracking-[0.2em] mb-4">
            India&rsquo;s Creator Marketplace
          </p>
          <h2 className="text-[52px] font-black text-white leading-[0.9] uppercase">
            Your audience<br />
            is your<br />
            <span className="text-[#9FE870]">superpower.</span>
          </h2>
          <p className="mt-5 text-white/60 text-[15px] leading-relaxed">
            10,000+ Indian creators are already earning on Crayon.
          </p>
        </div>

        {/* Bottom stat strip */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex gap-8 px-10 py-5"
          style={{ background: 'linear-gradient(to top, rgba(22,51,0,0.6), transparent)' }}>
          {[['₹2Cr+', 'Paid to Creators'], ['72h', 'Avg Payout'], ['10K+', 'Active Creators']].map(([v, l]) => (
            <div key={l}>
              <p className="text-[#9FE870] text-[18px] font-black leading-tight">{v}</p>
              <p className="text-white/50 text-[12px]">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center bg-white px-8 py-12 lg:px-14 relative">

        {/* Mobile-only logo */}
        <Link href="/" className="lg:hidden text-[22px] font-black text-[#163300] mb-10 block">
          Crayon
        </Link>

        <div className="w-full max-w-[360px] mx-auto">
          <h1 className="text-[28px] font-black text-[#121511] mb-1">Sign in</h1>
          <p className="text-[15px] text-[#6A6C6A] mb-8">Welcome back. Let&rsquo;s get you earning.</p>

          {/* Google */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-[#E8E8E8] text-[15px] font-semibold text-[#121511] hover:border-[#163300]/40 hover:bg-[#FAFAFA] transition-all mb-5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E8E8E8]" />
            <span className="text-[13px] text-[#B0B2AF]">or</span>
            <div className="flex-1 h-px bg-[#E8E8E8]" />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={e => e.key === 'Enter' && signInWithEmail()}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                onKeyDown={e => e.key === 'Enter' && signInWithEmail()}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9C9A] hover:text-[#163300] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign in button */}
          <button
            onClick={signInWithEmail}
            disabled={loading}
            className="w-full bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-8"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          {/* Sign up links */}
          <div className="space-y-3 text-center">
            <p className="text-[14px] text-[#6A6C6A]">
              New creator?{' '}
              <Link href="/onboarding/creator" className="text-[#163300] font-bold hover:underline">
                Create your profile free →
              </Link>
            </p>
            <p className="text-[14px] text-[#6A6C6A]">
              Hiring creators?{' '}
              <Link href="/onboarding/brand" className="text-[#163300] font-bold hover:underline">
                Join as a brand →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
