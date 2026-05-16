'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

  const InputStyle = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

  return (
    <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center px-4 py-12" style={{ fontFamily: 'var(--font-inter), Inter, Arial, sans-serif' }}>
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-[24px] font-black text-[#163300]">Crayon</Link>
          <p className="text-[15px] text-[#6A6C6A] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#163300]/8">
          {/* Google */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2 border-[#163300]/15 text-[15px] font-semibold text-[#121511] hover:border-[#163300]/40 hover:bg-[#EDEFEB]/50 transition-all mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#EDEFEB]" />
            <span className="text-[13px] text-[#6A6C6A]">or</span>
            <div className="flex-1 h-px bg-[#EDEFEB]" />
          </div>

          {/* Email + Password */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={InputStyle}
                onKeyDown={e => e.key === 'Enter' && signInWithEmail()}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#163300] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${InputStyle} pr-12`}
                  onKeyDown={e => e.key === 'Enter' && signInWithEmail()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6A6C6A] hover:text-[#163300]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={signInWithEmail}
            disabled={loading}
            className="w-full bg-[#163300] text-[#9FE870] font-bold text-[16px] py-3.5 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </div>

        {/* New here? */}
        <div className="mt-6 text-center space-y-3">
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
  )
}
