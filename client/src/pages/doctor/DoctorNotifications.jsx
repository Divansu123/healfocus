import { useEffect, useState } from 'react'
import { PageTitle } from '@/components/ui'
import { hospitalApi } from '@/api'
import toast from 'react-hot-toast'

export default function DoctorNotifications({ onClose }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    hospitalApi.getNotifications()
      .then(res => setNotifs(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      await hospitalApi.markNotificationRead(id)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  const markAll = async () => {
    try {
      await Promise.all(notifs.filter(n => !n.read).map(n => hospitalApi.markNotificationRead(n.id)))
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    } catch { toast.error('Failed') }
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-start lg:justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-t-3xl lg:rounded-3xl lg:mt-16 lg:mr-4 max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <p className="text-base font-black text-primary-950">🔔 Notifications</p>
            {unread > 0 && <p className="text-xs text-primary-600 font-bold">{unread} unread</p>}
          </div>
          <div className="flex gap-2 items-center">
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-bold text-primary-600">Mark all read</button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
          ) : !notifs.length ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🔔</p>
              <p className="text-sm font-bold">No notifications</p>
            </div>
          ) : notifs.map(n => (
            <div key={n.id} onClick={() => !n.read && markRead(n.id)}
              className={`px-5 py-3.5 flex gap-3 items-start cursor-pointer border-b border-gray-50 transition-all ${n.read ? 'bg-white' : 'bg-primary-50'}`}>
              <span className="text-xl flex-shrink-0">{n.icon || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${n.read ? 'text-gray-700' : 'text-primary-950'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 ml-2" />}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message || n.msg}</p>
                <p className="text-[10px] text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
