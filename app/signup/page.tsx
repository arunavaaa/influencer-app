'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Suspense } from 'react'

function SignupForm() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState<'creator' | 'brand'>((params.get('role') as 'creator' | 'brand') ?? 'creator')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const r = params.get('role')
    if (r === 'brand' || r === 'creator') setRole(r)
  }, [params])

  async function signUpWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${role}` },
    })
    if (error) toast.error(error.message)
  }

  async function signUpWithEmail() {
    if (!name.trim()) { toast.error('Enter your name'); return }
    if (!email.trim()) { toast.error('Enter your email'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!agreed) { toast.error('Please accept the terms to continue'); return }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (!data.user) { toast.error('Signup failed'); setLoading(false); return }

    await supabase.from('users').insert({ id: data.user.id, role })

    if (role === 'brand') router.push('/onboarding/brand')
    else router.push('/onboarding/creator')
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center px-4 py-12" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <div className="w-full max-w-[420px]">
        <Link href="/" className="block text-[22px] font-black text-[#163300] mb-8 text-center">GrabCollab</Link>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {(['creator', 'brand'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`p-4 rounded-[20px] border-2 text-left transition-all ${role === r ? 'border-[#163300] bg-white' : 'border-[#E8E8E8] bg-white/60 hover:border-[#163300]/40'}`}>
              <div className="text-[22px] mb-1">{r === 'creator' ? '🎨' : '🏢'}</div>
              <p className={`text-[15px] font-bold ${role === r ? 'text-[#163300]' : 'text-[#6A6C6A]'}`}>
                {r === 'creator' ? "I'm a Creator" : "I'm a Brand"}
              </p>
              <p className="text-[12px] text-[#9A9C9A] mt-0.5">
                {r === 'creator' ? 'Apply to campaigns' : 'Post campaigns & hire'}
              </p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[24px] p-8 shadow-sm">
          <h1 className="text-[24px] font-black text-[#121511] mb-6">
            {role === 'creator' ? 'Create your creator profile' : 'Join as a brand'}
          </h1>

          <button onClick={signUpWithGoogle} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-[#E8E8E8] text-[15px] font-semibold text-[#121511] hover:border-[#163300]/40 hover:bg-[#FAFAFA] transition-all mb-5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E8E8E8]" />
            <span className="text-[13px] text-[#B0B2AF]">or</span>
            <div className="flex-1 h-px bg-[#E8E8E8]" />
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">
                {role === 'brand' ? 'Brand Name' : 'Full Name'}
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={role === 'brand' ? 'Your brand name' : 'Your full name'}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" onKeyDown={e => e.key === 'Enter' && signUpWithEmail()}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9C9A] hover:text-[#163300]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#163300] flex-shrink-0" />
            <span className="text-[13px] text-[#6A6C6A]">
              I agree to the <Link href="/terms" className="text-[#163300] font-semibold hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#163300] font-semibold hover:underline">Privacy Policy</Link>
            </span>
          </label>

          <button onClick={signUpWithEmail} disabled={loading}
            className="w-full bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account →'}
          </button>
        </div>

        <p className="text-center text-[14px] text-[#6A6C6A] mt-5">
          Already have an account? <Link href="/login" className="text-[#163300] font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>
}
