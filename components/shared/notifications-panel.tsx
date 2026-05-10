'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Bell, CheckCheck, MessageSquare, FileText, CreditCard, Package } from 'lucide-react'

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

type Props = {
  open: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  contract: FileText,
  payment: CreditCard,
  application: Package,
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationsPanel({ open, onClose, onUnreadChange }: Props) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  async function fetchNotifications() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    onUnreadChange?.((data || []).filter((n) => !n.read).length)
    setLoading(false)
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    onUnreadChange?.(0)
    toast.success('All marked as read')
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    const unread = notifications.filter((n) => n.id !== id && !n.read).length
    onUnreadChange?.(unread)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E8E8]">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#163300]" />
            <h2 className="text-[20px] font-black text-[#121511]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-[#9FE870] text-[#163300] text-[12px] font-black px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[13px] font-semibold text-[#163300] hover:opacity-70 transition-opacity"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#EDEFEB] rounded-full transition-colors ml-2"
            >
              <X className="w-5 h-5 text-[#6A6C6A]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#9FE870] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-[#EDEFEB] rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-[#6A6C6A]" />
              </div>
              <p className="text-[18px] font-bold text-[#121511] mb-2">No notifications</p>
              <p className="text-[14px] text-[#6A6C6A]">
                You&apos;re all caught up! Notifications will appear here.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-4 px-6 py-4 border-b border-[#E8E8E8] hover:bg-[#EDEFEB]/50 transition-colors text-left ${
                      !n.read ? 'bg-[#9FE870]/5' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        !n.read ? 'bg-[#9FE870] text-[#163300]' : 'bg-[#EDEFEB] text-[#6A6C6A]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] leading-relaxed ${!n.read ? 'font-semibold text-[#121511]' : 'text-[#6A6C6A]'}`}>
                        {n.message}
                      </p>
                      <p className="text-[12px] text-[#6A6C6A] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-[#9FE870] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
