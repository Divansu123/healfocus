import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, Badge, Tabs, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import { Calendar, Clock, MapPin, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import { patientApi } from '@/api'

export default function PatientAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  const TABS = [
    { id: 'upcoming',  label: 'Upcoming'  },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  const load = () => {
    setLoading(true)
    patientApi.getAppointments()
      .then(res => setAppointments(res.data?.data || []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await patientApi.cancelAppointment(id)
      toast.success('Appointment cancelled')
      load()
    } catch { toast.error('Failed to cancel') }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const filtered = appointments.filter(a => {
    if (tab === 'upcoming')  return (a.status !== 'cancelled' && a.status !== 'completed') && a.date >= todayStr
    if (tab === 'completed') return a.status === 'completed'
    if (tab === 'cancelled') return a.status === 'cancelled'
    return true
  })

  const STATUS_COLOR = {
    pending:   'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TopBar hideOnDesktop title="My Appointments" onBack={() => navigate('/patient')} />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 lg:pb-4 lg:px-0 lg:pt-0">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : !filtered.length ? (
          <EmptyState icon="📅" title={`No ${tab} appointments`} desc="Book a new appointment to get started" />
        ) : (
          <div className="space-y-3 mt-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white border border-primary-100 rounded-2xl p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-primary-950">{a.doctor?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{a.doctor?.speciality || ''}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={11} /><span>{fmtDate(a.date)}</span>
                    <Clock size={11} /><span>{a.time}</span>
                  </div>
                  {a.hospital?.name && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={11} /><span>{a.hospital.name}</span>
                    </div>
                  )}
                  {a.reason && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Stethoscope size={11} /><span>{a.reason}</span>
                    </div>
                  )}
                </div>
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  <button onClick={() => cancel(a.id)}
                    className="mt-3 w-full py-1.5 text-xs font-bold border border-red-200 text-red-600 rounded-xl bg-red-50">
                    Cancel Appointment
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
