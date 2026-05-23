'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setEmail(user.email || '')
    setNewEmail(user.email || '')
    setLoading(false)
  }

  async function updateEmail() {
    if (!newEmail.trim() || newEmail === email) { toast.error('Enter a new email address'); return }
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setSavingEmail(false)
    if (error) { toast.error(error.message); return }
    toast.success('Confirmation email sent to ' + newEmail + '. Check your inbox.')
  }

  async function updatePassword() {
    if (!newPassword) { toast.error('Enter a new password'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  async function deleteAccount() {
    if (deleteInput !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setDeletingAccount(true)
    await supabase.auth.signOut()
    toast.success('Account deleted. Goodbye!')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEFEB] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#163300] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EDEFEB]">
      <div className="px-8 py-8">
        <div className="max-w-[640px]">

          <div className="mb-8">
            <h1 className="text-[30px] font-black text-[#121511]">Account Settings</h1>
            <p className="text-[15px] text-[#6A6C6A] mt-1">Manage your login credentials and account preferences.</p>
          </div>

          {/* Email */}
          <div className="bg-white rounded-[24px] p-6 mb-4">
            <h2 className="text-[16px] font-black text-[#121511] mb-1">Email address</h2>
            <p className="text-[13px] text-[#6A6C6A] mb-4">A confirmation link will be sent to your new email address.</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]"
                />
              </div>
              <button
                onClick={updateEmail}
                disabled={savingEmail || newEmail === email}
                className="self-start px-5 py-2.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingEmail ? <><div className="w-4 h-4 border-2 border-[#9FE870] border-t-transparent rounded-full animate-spin" />Saving…</> : 'Update email'}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-[24px] p-6 mb-4">
            <h2 className="text-[16px] font-black text-[#121511] mb-1">Change password</h2>
            <p className="text-[13px] text-[#6A6C6A] mb-4">Use at least 8 characters with a mix of letters and numbers.</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 pr-12 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B2AF] hover:text-[#121511]">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-[#163300] mb-1.5">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 pr-12 rounded-[12px] border border-[#E8E8E8] text-[14px] text-[#121511] bg-white focus:outline-none focus:border-[#163300]"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B2AF] hover:text-[#121511]">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={updatePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="self-start px-5 py-2.5 rounded-[12px] bg-[#163300] text-[#9FE870] text-[14px] font-bold hover:bg-[#1f4a00] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingPassword ? <><div className="w-4 h-4 border-2 border-[#9FE870] border-t-transparent rounded-full animate-spin" />Saving…</> : 'Update password'}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-[24px] p-6 border border-red-100">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[16px] font-black text-[#121511]">Delete account</h2>
                <p className="text-[13px] text-[#6A6C6A] mt-0.5">Permanently delete your account and all your data. This cannot be undone.</p>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-5 py-2.5 rounded-[12px] border border-red-200 text-red-600 text-[14px] font-bold hover:bg-red-50 transition-colors"
              >
                Delete my account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-[#6A6C6A]">Type <strong className="text-red-600">DELETE</strong> to confirm:</p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-3 rounded-[12px] border border-red-200 text-[14px] text-[#121511] bg-white focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }} className="flex-1 py-2.5 rounded-[12px] border border-[#E8E8E8] text-[14px] font-semibold text-[#121511] hover:bg-[#EDEFEB] transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deletingAccount || deleteInput !== 'DELETE'}
                    className="flex-1 py-2.5 rounded-[12px] bg-red-600 text-white text-[14px] font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deletingAccount ? 'Deleting…' : 'Confirm delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
