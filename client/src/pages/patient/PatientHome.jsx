import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { fmtDate } from '@/lib/utils'
import { ChevronRight, Calendar, MapPin, Gift } from 'lucide-react'
import { patientApi, publicApi } from '@/api'

const QUICK_ACTIONS = [
  { icon: '🩺', label: 'Book\nAppointment', color: 'from-primary-600 to-violet-600', to: '/patient/book' },
  { icon: '📋', label: 'My\nRecords',       color: 'from-emerald-500 to-teal-600',   to: '/patient/records' },
  { icon: '❤️', label: 'Health\nTracker',   color: 'from-rose-500 to-pink-600',      to: '/patient/health' },
  { icon: '✨', label: 'GenZ\nFeatures',    color: 'from-amber-500 to-orange-500',   to: '/patient/genz' },
]

export default function PatientHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [promotions, setPromotions] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    patientApi.getAppointments().then(res => setAppointments(res.data?.data || [])).catch(() => {})
    publicApi.getPromotions().then(res => setPromotions(res.data?.data || [])).catch(() => {})
    patientApi.getNotifications().then(res => setNotifications(res.data?.data || [])).catch(() => {})
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const upcomingAppts = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed' && a.date >= todayStr).slice(0, 2)
  const unread = notifications.filter(n => !n.read).length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 pt-4 pb-24 lg:px-0 lg:pt-0 lg:pb-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-800 to-violet-700 rounded-3xl p-5 text-white mb-5">
        <p className="text-sm opacity-80">{greeting},</p>
        <p className="text-xl font-black">{user?.name?.split(' ')[0]} 👋</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] opacity-70 font-bold uppercase">Upcoming</p>
            <p className="text-xl font-black">{upcomingAppts.length}</p>
            <p className="text-[10px] opacity-70">Appointments</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <p className="text-[10px] opacity-70 font-bold uppercase">Alerts</p>
            <p className="text-xl font-black">{unread}</p>
            <p className="text-[10px] opacity-70">Notifications</p>
          </div>
          {user?.bloodType && (
            <div className="flex-1 bg-white/10 rounded-2xl p-3">
              <p className="text-[10px] opacity-70 font-bold uppercase">Blood</p>
              <p className="text-xl font-black">{user.bloodType}</p>
              <p className="text-[10px] opacity-70">Type</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {QUICK_ACTIONS.map(a => (
          <button key={a.to} onClick={() => navigate(a.to)}
            className={`bg-gradient-to-br ${a.color} rounded-2xl p-3 text-white text-center shadow-card-md`}>
            <p className="text-2xl mb-1">{a.icon}</p>
            <p className="text-[10px] font-bold leading-tight whitespace-pre-line">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppts.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Upcoming Appointments</p>
            <button onClick={() => navigate('/patient/appointments')} className="text-[10px] font-bold text-primary-600 flex items-center gap-0.5">View all <ChevronRight size={10}/></button>
          </div>
          <div className="space-y-2">
            {upcomingAppts.map(a => (
              <div key={a.id} className="bg-white border border-primary-100 rounded-2xl p-3 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200">👨‍⚕️</div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary-950">{a.doctor?.name || '—'}</p>
                  <p className="text-[10px] text-gray-500">{a.doctor?.speciality}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar size={9} className="text-gray-400" /><span className="text-[10px] text-gray-400">{fmtDate(a.date)} · {a.time}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status==='confirmed'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Offers & Promotions</p>
            <Gift size={14} className="text-gray-400" />
          </div>
          <div className="space-y-2">
            {promotions.slice(0, 3).map(p => (
              <div key={p.id} className="rounded-2xl p-4 text-white" style={{ background: p.color || 'linear-gradient(135deg,#1e8a4c,#34d399)' }}>
                <p className="text-sm font-black">{p.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{p.description || p.desc}</p>
                {p.discount && <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full mt-2 inline-block">{p.discount}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
