import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import { useNotificationStore } from '@/store/notificationStore'
import { hospitalApi } from '@/api'
import toast from 'react-hot-toast'

const TYPE_LABELS = {
  appt:      { icon: '📅', bg: 'bg-blue-50 border-blue-200' },
  signup:    { icon: '✅', bg: 'bg-green-50 border-green-200' },
  service:   { icon: '🔧', bg: 'bg-orange-50 border-orange-200' },
  admission: { icon: '🛏️', bg: 'bg-purple-50 border-purple-200' },
  promo:     { icon: '🎁', bg: 'bg-pink-50 border-pink-200' },
}

export default function DoctorNotifications() {
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotificationStore()

  const handleMarkRead = async (id) => {
    try {
      await hospitalApi.markNotificationRead(id)
      markRead(id)
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(unread.map(n => hospitalApi.markNotificationRead(n.id)))
      markAllRead()
    } catch { toast.error('Failed') }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar
        hideOnDesktop
        title="Notifications"
        onBack={() => navigate('/hospital/appointments')}
        actions={
          unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary-400">
              Mark all read
            </button>
          )
        }
      />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-primary-950">🔔 Notifications</h2>
            {unreadCount > 0 && <p className="text-xs text-red-500 font-bold mt-0.5">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead}
              className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200">
              ✓ Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : !notifications.length ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🔔</p>
            <p className="text-sm font-bold">No notifications yet</p>
            <p className="text-xs mt-1">Appointment bookings and service updates will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const meta = TYPE_LABELS[n.type] || { icon: '🔔', bg: '' }
              return (
                <div key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={`rounded-2xl p-4 flex gap-3 items-start cursor-pointer transition-all border ${
                    n.read ? 'bg-white border-gray-100' : `${meta.bg || 'bg-primary-50 border-primary-200'}`
                  }`}>
                  <span className="text-xl flex-shrink-0">{n.icon || meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold truncate ${n.read ? 'text-gray-700' : 'text-primary-950'}`}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message || n.msg}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
