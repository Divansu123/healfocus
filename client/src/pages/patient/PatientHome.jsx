import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { fmtDate } from '@/lib/utils'
import { ChevronRight, Calendar, Clock, MapPin, Gift, Star, Phone, Zap } from 'lucide-react'
import { patientApi, publicApi } from '@/api'

const QUICK_ACTIONS = [
  { icon: '🩺', label: 'Book\nAppt',      color: 'from-primary-600 to-violet-600', to: '/patient/book' },
  { icon: '📋', label: 'My\nRecords',     color: 'from-emerald-500 to-teal-600',   to: '/patient/records' },
  { icon: '❤️', label: 'Health\nTracker', color: 'from-rose-500 to-pink-600',      to: '/patient/health' },
  { icon: '✨', label: 'GenZ\nFeatures',  color: 'from-amber-500 to-orange-500',   to: '/patient/genz' },
  { icon: '🧘', label: 'Wellness\n& AI',  color: 'from-teal-500 to-cyan-600',      to: '/patient/wellness' },
  { icon: '🆘', label: 'SOS &\nQR Card',  color: 'from-red-500 to-rose-600',       to: '/patient/wellness' },
]

export default function PatientHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [appointments, setAppointments]   = useState([])
  const [promotions, setPromotions]       = useState([])
  const [notifications, setNotifications] = useState([])
  const [hospitals, setHospitals]         = useState([])
  const [bsReadings, setBsReadings]       = useState([])
  const [bpReadings, setBpReadings]       = useState([])

  useEffect(() => {
    Promise.allSettled([
      patientApi.getAppointments(),
      publicApi.getPromotions(),
      patientApi.getNotifications(),
      publicApi.getHospitals(),
      patientApi.getBloodSugar(),
      patientApi.getBloodPressure(),
    ]).then(([apptR, promoR, notifR, hospR, bsR, bpR]) => {
      if (apptR.status  === 'fulfilled') setAppointments(apptR.value.data?.data || [])
      if (promoR.status === 'fulfilled') setPromotions(promoR.value.data?.data || [])
      if (notifR.status === 'fulfilled') setNotifications(notifR.value.data?.data || [])
      if (hospR.status  === 'fulfilled') setHospitals(hospR.value.data?.data || [])
      if (bsR.status    === 'fulfilled') setBsReadings(bsR.value.data?.data || [])
      if (bpR.status    === 'fulfilled') setBpReadings(bpR.value.data?.data || [])
    })
  }, [])

  const todayStr      = new Date().toISOString().split('T')[0]
  const upcomingAppts = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed' && a.date >= todayStr).slice(0, 2)
  const unread        = notifications.filter(n => !n.read).length
  const hour          = new Date().getHours()
  const greeting      = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const lastBS = bsReadings[0]
  const lastBP = bpReadings[0]

  const bsColor = (v) => !v ? '#94a3b8' : v > 180 || v < 70 ? '#ef4444' : v > 125 ? '#f59e0b' : '#22c55e'
  const bpColor = (s) => !s ? '#94a3b8' : s >= 140 ? '#ef4444' : s >= 130 ? '#f59e0b' : '#22c55e'

  return (
    <div className="px-4 pt-4 pb-24 lg:px-0 lg:pt-0 lg:pb-6 space-y-5">

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-800 to-violet-700 rounded-3xl p-5 text-white">
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
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => navigate(a.to)}
            className={`bg-gradient-to-br ${a.color} rounded-2xl p-3 text-white text-center shadow-card-md active:scale-95 transition-transform`}>
            <p className="text-2xl mb-1">{a.icon}</p>
            <p className="text-[10px] font-bold leading-tight whitespace-pre-line">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Health Snapshot */}
      {(lastBS || lastBP) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Health Snapshot</p>
            <button onClick={() => navigate('/patient/health')} className="text-[10px] font-bold text-primary-600 flex items-center gap-0.5">
              Track <ChevronRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lastBS && (
              <div onClick={() => navigate('/patient/health')}
                className="bg-white border border-primary-100 rounded-2xl p-3 shadow-card cursor-pointer hover:border-primary-300 transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">🩸</span>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Blood Sugar</p>
                </div>
                <p className="text-2xl font-black leading-none" style={{ color: bsColor(lastBS.value) }}>{lastBS.value}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">mg/dL · {lastBS.type}</p>
                <p className="text-[9px] text-gray-400">{fmtDate(lastBS.date)}</p>
              </div>
            )}
            {lastBP && (
              <div onClick={() => navigate('/patient/health?tab=bp')}
                className="bg-white border border-primary-100 rounded-2xl p-3 shadow-card cursor-pointer hover:border-primary-300 transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">💓</span>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Blood Pressure</p>
                </div>
                <p className="text-2xl font-black leading-none" style={{ color: bpColor(lastBP.systolic) }}>{lastBP.systolic}/{lastBP.diastolic}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">mmHg{lastBP.pulse ? ` · ${lastBP.pulse} bpm` : ''}</p>
                <p className="text-[9px] text-gray-400">{fmtDate(lastBP.date)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Upcoming Appointments</p>
            <button onClick={() => navigate('/patient/appointments')} className="text-[10px] font-bold text-primary-600 flex items-center gap-0.5">
              View all <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingAppts.map(a => (
              <div key={a.id} className="bg-white border border-primary-100 rounded-2xl p-3 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl border border-primary-200">👨‍⚕️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary-950 truncate">{a.doctor?.name || '—'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{a.doctor?.speciality}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400"><Calendar size={9} />{fmtDate(a.date)}</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={9} />{a.time}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Hospitals */}
      {hospitals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">🏥 Nearby Hospitals</p>
            <button onClick={() => navigate('/patient/book')} className="text-[10px] font-bold text-primary-600 flex items-center gap-0.5">
              Book Appt <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {hospitals.slice(0, 3).map((h, idx) => (
              <div key={h.id}
                onClick={() => navigate('/patient/book')}
                className="bg-white border border-primary-100 rounded-2xl p-3 shadow-card flex items-center gap-3 cursor-pointer hover:border-primary-300 transition-all active:scale-[0.99]">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0 border border-primary-200">
                  {h.icon || '🏥'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {idx === 0 && (
                      <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Nearest</span>
                    )}
                    <p className="text-xs font-bold text-primary-950 truncate">{h.name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {h.city && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><MapPin size={9} />{h.city}</span>
                    )}
                    {h.rating && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold"><Star size={9} />{h.rating}</span>
                    )}
                    {h.beds && <span className="text-[10px] text-gray-400">{h.beds} beds</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {h.phone && (
                    <button onClick={e => { e.stopPropagation(); window.open(`tel:${h.phone}`) }}
                      className="flex items-center gap-0.5 text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-full">
                      <Phone size={9} /> Call
                    </button>
                  )}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    h.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>{h.status || 'active'}</span>
                </div>
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
              <div key={p.id} className="rounded-2xl p-4 text-white relative overflow-hidden"
                style={{ background: p.color || 'linear-gradient(135deg,#1e8a4c,#34d399)' }}>
                <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-white/5 -translate-y-4 translate-x-4 pointer-events-none" />
                <p className="text-sm font-black">{p.title}</p>
                <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{p.description || p.desc}</p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  {p.discount && <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full">{p.discount}</span>}
                  {p.validTill && <span className="text-[10px] opacity-70">Till {fmtDate(p.validTill)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access Footer */}
      <div className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
        <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap size={12} className="text-primary-600" /> Quick Access
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🏥', label: 'Request Admission', to: '/patient/admissions' },
            { icon: '👨‍👩‍👧', label: 'Family Members',    to: '/patient/records' },
            { icon: '🛡️', label: 'My Insurance',      to: '/patient/records' },
            { icon: '🔐', label: 'Privacy & Consent', to: '/patient/profile' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.to)}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:border-primary-200 hover:bg-primary-50 transition-all text-left active:scale-95">
              <span className="text-base">{item.icon}</span>
              <span className="text-[11px] font-bold text-gray-700 leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
