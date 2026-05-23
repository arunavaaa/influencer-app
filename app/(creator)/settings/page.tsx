'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const I = 'w-full px-4 py-3 rounded-2xl border border-[#163300]/20 bg-white text-[15px] text-[#121511] placeholder-[#B0B2AF] focus:outline-none focus:border-[#163300] transition-colors'

export default function Settings() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user?.email) setEmail(user.email) })
  }, [])

  async function changePw() {
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) toast.error(error.message)
    else { toast.success('Password updated!'); setNewPw(''); setConfirmPw('') }
    setSaving(false)
  }

  async function deleteAccount() {
    setDeleting(true)
    toast.error('Account deletion requires support. Email us at support@grabcollab.com')
    setDeleting(false)
    setConfirm(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-[600px]">
      <h1 className="text-[28px] font-black text-[#121511] mb-8">Settings</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[16px] font-black text-[#121511] mb-4">Account</h2>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5">Email Address</label>
            <input className={`${I} bg-[#F5F5F5] text-[#6A6C6A]`} value={email} readOnly />
            <p className="text-[12px] text-[#9A9C9A] mt-1">To change your email, contact support@grabcollab.com</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6">
          <h2 className="text-[16px] font-black text-[#121511] mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5">New Password</label>
              <input type="password" className={I} placeholder="Min 8 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#163300] mb-1.5">Confirm New Password</label>
              <input type="password" className={I} placeholder="Repeat password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            </div>
            <button onClick={changePw} disabled={saving} className="bg-[#163300] text-[#9FE870] font-bold text-[14px] py-3 px-6 rounded-full hover:bg-[#1f4a00] transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Update Password'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-red-100">
          <h2 className="text-[16px] font-black text-red-600 mb-2">Danger Zone</h2>
          <p className="text-[14px] text-[#6A6C6A] mb-4">Permanently delete your account and all your data. This cannot be undone.</p>
          {!confirm
            ? <button onClick={() => setConfirm(true)} className="px-5 py-2.5 border-2 border-red-200 text-red-600 text-[13px] font-bold rounded-full hover:bg-red-50 transition-colors">Delete Account</button>
            : (
              <div className="flex gap-3">
                <button onClick={deleteAccount} disabled={deleting} className="px-5 py-2.5 bg-red-600 text-white text-[13px] font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-60">
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button onClick={() => setConfirm(false)} className="px-5 py-2.5 bg-[#EDEFEB] text-[#6A6C6A] text-[13px] font-semibold rounded-full hover:bg-[#E0E2DE] transition-colors">Cancel</button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
