'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Package, IndianRupee, MessageSquare, Megaphone, CheckCircle, Clock } from 'lucide-react'

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  offer_received: <Package className="w-4 h-4 text-[#163300]" />,
  application_accepted: <CheckCircle className="w-4 h-4 text-green-600" />,
  application_rejected: <CheckCircle className="w-4 h-4 text-red-500" />,
  escrow_funded: <IndianRupee className="w-4 h-4 text-yellow-600" />,
  content_approved: <CheckCircle className="w-4 h-4 text-green-600" />,
  revision_requested: <Clock className="w-4 h-4 text-orange-500" />,
  new_message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  auto_approved: <CheckCircle className="w-4 h-4 text-green-600" />,
  payment_sent: <IndianRupee className="w-4 h-4 text-green-600" />,
  campaign_invite: <Megaphone className="w-4 h-4 text-[#163300]" />,
}

function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function NotificationsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('notifications')
      .select('id, type, message, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    setLoading(false)

    // Mark all unread as read
    const unreadIds = (data || []).filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    }
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

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

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[30px] font-black text-[#121511]">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[15px] text-[#6A6C6A] mt-1">{unreadCount} unread</p>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#EDEFEB] text-[#163300] text-[13px] font-bold hover:bg-[#9FE870] transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-[24px] p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#EDEFEB] flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-[#B0B2AF]" />
              </div>
              <p className="text-[18px] font-black text-[#121511] mb-2">All caught up</p>
              <p className="text-[14px] text-[#6A6C6A]">You have no notifications yet. We'll let you know when something happens.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] overflow-hidden">
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-6 py-4 ${i < notifications.length - 1 ? 'border-b border-[#E8E8E8]' : ''} ${!n.read ? 'bg-[#9FE870]/5' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.read ? 'bg-[#9FE870]/20' : 'bg-[#EDEFEB]'}`}>
                    {TYPE_ICONS[n.type] || <Bell className="w-4 h-4 text-[#6A6C6A]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] leading-snug ${!n.read ? 'font-semibold text-[#121511]' : 'text-[#4A4C4A]'}`}>{n.message}</p>
                    <p className="text-[12px] text-[#B0B2AF] mt-1">{fmtRelative(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[#163300] flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
