'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const LeftPanel = () => (
  <div className="hidden lg:flex flex-1 relative overflow-hidden">
    <Image src="/login-bg.png" alt="Creator" fill className="object-cover object-center" priority />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(22,51,0,0.72) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)' }} />
    <Link href="/" className="absolute top-8 left-10 text-[22px] font-black text-white tracking-tight hover:opacity-80 transition-opacity z-10">
      GrabCollab
    </Link>
    <div className="absolute bottom-12 left-10 z-10 max-w-[420px]">
      <p className="text-[#9FE870] text-[13px] font-black uppercase tracking-[0.2em] mb-4">India&rsquo;s Creator Hiring Portal</p>
      <h2 className="text-[52px] font-black text-white leading-[0.9] uppercase">
        Your audience<br />is your<br /><span className="text-[#9FE870]">superpower.</span>
      </h2>
    </div>
  </div>
)

function LoginInner() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const step = params.get('step')

  const errorParam = params.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(errorParam === 'no_profile' ? 'no_profile' : null)
  const [choosingRole, setChoosingRole] = useState<'brand' | 'creator' | null>(null)

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
    setLoginError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError(error.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    if (!data) {
      await supabase.auth.signOut()
      setLoginError('no_profile')
      setLoading(false)
      return
    }
    if (data.role === 'brand') {
      router.push('/brand/dashboard')
    } else if (data.role === 'creator' || data.role === 'influencer') {
      const { data: profile } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (!profile) {
        await supabase.auth.signOut()
        setLoginError('no_profile')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } else {
      await supabase.auth.signOut()
      setLoginError('no_profile')
      setLoading(false)
    }
  }

  async function chooseRole(chosenRole: 'brand' | 'creator') {
    setChoosingRole(chosenRole)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const dbRole = chosenRole === 'creator' ? 'influencer' : chosenRole
    await fetch('/api/set-role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: dbRole }) })
    if (chosenRole === 'brand') router.push('/onboarding/brand')
    else router.push('/onboarding/creator')
  }

  if (step === 'choose-role') {
    return (
      <div className="h-screen overflow-hidden -mt-16 flex" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        <LeftPanel />
        <div className="w-full lg:w-[480px] flex flex-col justify-center bg-white px-8 py-12 lg:px-14 relative">
          <Link href="/" className="lg:hidden text-[22px] font-black text-[#163300] mb-10 block">GrabCollab</Link>
          <div className="w-full max-w-[360px] mx-auto">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9A9C9A] mb-3">One last step</p>
            <h1 className="text-[28px] font-black text-[#121511] mb-2">How would you like to join?</h1>
            <p className="text-[15px] text-[#6A6C6A] mb-8">This Google account isn&apos;t registered yet. Choose how you&apos;d like to sign up.</p>

            <div className="space-y-3 mb-8">
              <button onClick={() => chooseRole('brand')} disabled={!!choosingRole}
                className="w-full p-5 rounded-[20px] border-2 border-[#E8E8E8] hover:border-[#163300] bg-white text-left transition-all disabled:opacity-60 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-[#163300] flex items-center justify-center text-[24px] flex-shrink-0">🏢</div>
                  <div className="flex-1">
                    <p className="text-[16px] font-black text-[#121511]">I&apos;m a Brand</p>
                    <p className="text-[13px] text-[#6A6C6A] mt-0.5">Post campaigns &amp; hire creators</p>
                  </div>
                  {choosingRole === 'brand'
                    ? <Loader2 className="w-4 h-4 animate-spin text-[#163300]" />
                    : <span className="text-[#B0B2AF] text-[20px] group-hover:text-[#163300] transition-colors">→</span>}
                </div>
              </button>

              <button onClick={() => chooseRole('creator')} disabled={!!choosingRole}
                className="w-full p-5 rounded-[20px] border-2 border-[#E8E8E8] hover:border-[#163300] bg-white text-left transition-all disabled:opacity-60 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-[#9FE870] flex items-center justify-center text-[24px] flex-shrink-0">🎨</div>
                  <div className="flex-1">
                    <p className="text-[16px] font-black text-[#121511]">I&apos;m a Creator</p>
                    <p className="text-[13px] text-[#6A6C6A] mt-0.5">Find brand collaborations</p>
                  </div>
                  {choosingRole === 'creator'
                    ? <Loader2 className="w-4 h-4 animate-spin text-[#163300]" />
                    : <span className="text-[#B0B2AF] text-[20px] group-hover:text-[#163300] transition-colors">→</span>}
                </div>
              </button>
            </div>

            <p className="text-center text-[14px] text-[#6A6C6A]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#163300] font-bold hover:underline">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden -mt-16 flex" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <LeftPanel />

      <div className="w-full lg:w-[480px] flex flex-col justify-center bg-white px-8 py-12 lg:px-14 relative">
        <Link href="/" className="lg:hidden text-[22px] font-black text-[#163300] mb-10 block">GrabCollab</Link>
        <div className="w-full max-w-[360px] mx-auto">
          <h1 className="text-[28px] font-black text-[#121511] mb-1">Sign in</h1>
          <p className="text-[15px] text-[#6A6C6A] mb-8">Welcome back. Sign in to continue.</p>

          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border-2 border-[#E8E8E8] text-[15px] font-semibold text-[#121511] hover:border-[#163300]/40 hover:bg-[#FAFAFA] transition-all mb-5">
            {GOOGLE_SVG}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E8E8E8]" />
            <span className="text-[13px] text-[#B0B2AF]">or</span>
            <div className="flex-1 h-px bg-[#E8E8E8]" />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A] mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setLoginError(null) }} placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && signInWithEmail()}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors" />
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#6A6C6A]">Password</label>
              <Link href="/forgot-password" className="text-[12px] text-[#163300] font-semibold hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setLoginError(null) }} placeholder="Your password" onKeyDown={e => e.key === 'Enter' && signInWithEmail()}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[#E8E8E8] bg-white text-[15px] text-[#121511] placeholder-[#C0C2C0] focus:outline-none focus:border-[#163300] transition-colors" />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9C9A] hover:text-[#163300] transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="mb-5 p-4 rounded-[14px] bg-red-50 border border-red-100">
              <p className="text-[13px] font-bold text-red-700 mb-1">Couldn&apos;t sign you in</p>
              <p className="text-[12px] text-red-600 leading-relaxed">
                This email isn&apos;t registered yet, or the password is incorrect.{' '}
                New here?{' '}
                <Link href="/for-creators" className="font-bold underline">Join as Creator</Link> or{' '}
                <Link href="/onboarding/brand" className="font-bold underline">Join as Brand</Link>.
              </p>
            </div>
          )}

          <button onClick={signInWithEmail} disabled={loading}
            className="w-full bg-[#163300] text-[#9FE870] font-bold text-[16px] py-4 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-8">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          <div className="text-center space-y-2">
            <p className="text-[14px] text-[#6A6C6A]">New creator? <Link href="/for-creators" className="text-[#163300] font-bold hover:underline">Create your profile free →</Link></p>
            <p className="text-[14px] text-[#6A6C6A]">Brand? <Link href="/onboarding/brand" className="text-[#163300] font-bold hover:underline">Join as a brand →</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginInner /></Suspense>
}
