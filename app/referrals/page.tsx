'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Copy, Gift, Users, IndianRupee, Check } from 'lucide-react'

type Referral = {
  id: string
  referred_user_id: string
  status: string
  reward_inr: number
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  expired: 'bg-[#EDEFEB] text-[#6A6C6A]',
}

export default function ReferralsPage() {
  const supabase = createClient()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    setReferrals(data || [])
    setLoading(false)
  }

  const referralLink = userId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${userId}`
    : ''

  async function copyLink() {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const totalReferrals = referrals.length
  const completedReferrals = referrals.filter((r) => r.status === 'completed').length
  const totalEarned = referrals
    .filter((r) => r.status === 'completed')
    .reduce((s, r) => s + r.reward_inr, 0)

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      {/* Hero */}
      <section className="bg-[#163300] px-5 md:px-[70px] py-[60px]">
        <div className="max-w-[1360px] mx-auto text-center">
          <div className="w-16 h-16 bg-[#9FE870] rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-[#163300]" />
          </div>
          <h1 className="text-[48px] font-black text-[#9FE870] uppercase leading-tight mb-4">
            Earn ₹500 Per Referral
          </h1>
          <p className="text-[18px] text-white/80 max-w-lg mx-auto mb-8">
            Refer a brand to Crayon. When they complete their first order, you earn ₹500 — and they get ₹250 off.
          </p>

          {/* Referral link box */}
          {userId && (
            <div className="max-w-lg mx-auto bg-white/10 border border-white/20 rounded-[24px] p-4 flex gap-3">
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent text-white text-[14px] focus:outline-none truncate"
              />
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-[#9FE870] text-[#163300] font-bold text-[14px] px-5 py-2 rounded-full hover:bg-[#8fdc60] transition-colors flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-[1360px] mx-auto px-5 md:px-[70px] py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Total Referrals', value: totalReferrals, icon: Users },
            { label: 'Completed', value: completedReferrals, icon: Check },
            { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, icon: IndianRupee },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-[24px] p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-[#163300] rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-[#9FE870]" />
              </div>
              <div>
                <p className="text-[25px] font-black text-[#163300]">{value}</p>
                <p className="text-[14px] text-[#6A6C6A]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-[24px] p-8 mb-8">
          <h2 className="text-[20px] font-black text-[#121511] mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Share Your Link', body: 'Copy your unique referral link and share it with brands you know.' },
              { n: '02', title: 'They Join Crayon', body: 'When a brand signs up through your link, they\'re attributed to you.' },
              { n: '03', title: 'You Get ₹500', body: 'Once the referred brand completes their first order, ₹500 is credited to your account.' },
            ].map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="text-[37px] font-black text-[#9FE870] leading-none flex-shrink-0">{s.n}</span>
                <div>
                  <h3 className="text-[16px] font-bold text-[#121511] mb-1">{s.title}</h3>
                  <p className="text-[14px] text-[#6A6C6A] leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals table */}
        <div className="bg-white rounded-[24px] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E8E8E8]">
            <h2 className="text-[20px] font-black text-[#121511]">Your Referrals</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-[16px] font-bold text-[#121511] mb-2">No referrals yet</p>
              <p className="text-[14px] text-[#6A6C6A]">
                Share your link to start earning ₹500 per referral.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#EDEFEB]">
                  <tr>
                    {['Date', 'Status', 'Reward'].map((h) => (
                      <th key={h} className="text-left text-[12px] font-bold text-[#6A6C6A] uppercase tracking-wider px-6 py-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-t border-[#E8E8E8]">
                      <td className="px-6 py-4 text-[14px] text-[#121511]">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[12px] font-bold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[r.status] || 'bg-[#EDEFEB] text-[#6A6C6A]'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[15px] font-black text-[#163300]">
                        {r.status === 'completed' ? `₹${r.reward_inr.toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
