import { useNavigate } from 'react-router-dom'
import { TopBar } from '@/components/ui'
import { useNotificationStore } from '@/store/notificationStore'
import { patientApi } from '@/api'
import toast from 'react-hot-toast'

export default function PatientNotifications() {
  const navigate = useNavigate()

  // Store se live data lo — socket update hone pe automatically re-render hoga
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotificationStore()

  const handleMarkRead = async (id) => {
    try {
      await patientApi.markNotificationRead(id)
      markRead(id) // store update
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(unread.map(n => patientApi.markNotificationRead(n.id)))
      markAllRead() // store update
    } catch { toast.error('Failed') }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar
        hideOnDesktop
        title="Notifications"
        onBack={() => navigate('/patient')}
        actions={
          unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary-400">
              Mark all read
            </button>
          )
        }
      />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : !notifications.length ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🔔</p>
            <p className="text-sm font-bold">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`rounded-2xl p-4 flex gap-3 items-start cursor-pointer transition-all ${n.read ? 'bg-white border border-gray-100' : 'bg-primary-50 border border-primary-200'}`}>
                <span className="text-xl flex-shrink-0">{n.icon || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${n.read ? 'text-gray-700' : 'text-primary-950'}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message || n.msg}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
